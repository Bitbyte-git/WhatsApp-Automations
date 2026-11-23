from rest_framework import viewsets, permissions, filters, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from decimal import Decimal

from apps.campaigns.models import Campaign, CampaignRecipient
from apps.campaigns.serializers import (
    CampaignSerializer,
    CampaignRecipientSerializer,
    CreateCampaignSerializer,
)
from apps.whatsapp.models import WhatsAppAccount
from apps.templates_manager.models import MessageTemplate
from apps.inbox.models import Contact, Conversation, Message
from apps.whatsapp.meta_client import MetaCloudAPIClient
from apps.billing.models import Wallet, WalletTransaction, UsageRecord

class CampaignViewSet(viewsets.ModelViewSet):
    """
    Broadcast campaigns. Execution dispatches through official Meta Cloud API only.
    Never simulates fake campaign deliveries.
    """
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'template__name']
    ordering_fields = ['name', 'created_at', 'status', 'scheduled_at']

    def get_queryset(self):
        user = self.request.user
        qs = Campaign.objects.none()
        if user.is_superadmin:
            client_id = self.request.query_params.get('client_id')
            if client_id:
                qs = Campaign.objects.filter(client_id=client_id)
            else:
                qs = Campaign.objects.all()
        elif user.client:
            qs = Campaign.objects.filter(client=user.client)

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param.upper())

        return qs.select_related('client', 'whatsapp_account', 'template')

    def create(self, request, *args, **kwargs):
        serializer = CreateCampaignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user = request.user

        account = WhatsAppAccount.objects.filter(id=data['whatsapp_account_id']).first()
        if not account:
            return Response({'error': 'WhatsApp account not found'}, status=status.HTTP_404_NOT_FOUND)

        if not user.is_superadmin and account.client != user.client:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)

        template = MessageTemplate.objects.filter(id=data['template_id'], client=account.client).first()
        if not template:
            return Response({'error': 'Template not found or does not belong to client'}, status=status.HTTP_404_NOT_FOUND)

        client = account.client
        contact_ids = data.get('contact_ids', [])
        if contact_ids:
            contacts = Contact.objects.filter(id__in=contact_ids, client=client, status='OPTED_IN')
        else:
            # Default to all opted-in contacts for client
            contacts = Contact.objects.filter(client=client, status='OPTED_IN')

        total = contacts.count()
        if total == 0:
            return Response({'error': 'No eligible contacts found for this campaign.'}, status=status.HTTP_400_BAD_REQUEST)

        scheduled_at = data.get('scheduled_at')
        initial_status = 'SCHEDULED' if scheduled_at and scheduled_at > timezone.now() else 'DRAFT'

        campaign = Campaign.objects.create(
            client=client,
            whatsapp_account=account,
            template=template,
            name=data['name'],
            scheduled_at=scheduled_at,
            status=initial_status,
            total_recipients=total,
            template_params=data.get('template_params', {})
        )

        # Create recipient tracking records
        recipients = [
            CampaignRecipient(campaign=campaign, contact=c, status='PENDING')
            for c in contacts
        ]
        CampaignRecipient.objects.bulk_create(recipients)

        return Response(CampaignSerializer(campaign).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def launch(self, request, pk=None):
        """
        Executes campaign delivery using official Meta WhatsApp Cloud API.
        Deducts real charges from client wallet.
        """
        campaign = self.get_object()
        if campaign.status in ['COMPLETED', 'IN_PROGRESS']:
            return Response({'error': f'Campaign is already {campaign.status}'}, status=status.HTTP_400_BAD_REQUEST)

        account = campaign.whatsapp_account
        client = campaign.client

        # Check Meta integration configuration
        meta_client = MetaCloudAPIClient(
            phone_number_id=account.phone_number_id,
            access_token=account.access_token,
            waba_id=account.waba_id
        )

        if not meta_client.is_configured:
            return Response({
                'error': 'WhatsApp integration is not configured. Cannot launch campaign without active Meta Cloud API credentials.',
                'configured': False
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check template approval status
        if campaign.template.status != 'APPROVED':
            return Response({
                'error': f"Template '{campaign.template.name}' is currently {campaign.template.status}. Only Meta-approved templates can be broadcast in campaigns."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate required wallet balance
        # Standard marketing message rate: e.g. 0.85 INR per recipient
        category = campaign.template.category or 'MARKETING'
        rate_per_msg = Decimal('0.8500') if category == 'MARKETING' else Decimal('0.4000')
        required_funds = rate_per_msg * campaign.total_recipients

        wallet, _ = Wallet.objects.get_or_create(client=client, defaults={'balance': 0.0000})
        if wallet.balance < required_funds:
            return Response({
                'error': 'Insufficient wallet balance to broadcast campaign.',
                'required_funds': str(required_funds),
                'wallet_balance': str(wallet.balance)
            }, status=status.HTTP_402_PAYMENT_REQUIRED)

        campaign.status = 'IN_PROGRESS'
        campaign.save(update_fields=['status'])

        recipients = campaign.recipients.filter(status='PENDING').select_related('contact')
        sent = 0
        failed = 0

        for r in recipients:
            res = meta_client.send_template_message(
                to_phone_number=r.contact.phone_number,
                template_name=campaign.template.name,
                language_code=campaign.template.language or 'en_US'
            )

            now = timezone.now()
            if res.get('success'):
                wamid = res.get('wamid')
                r.status = 'SENT'
                r.wamid = wamid or ''
                r.processed_at = now
                r.save(update_fields=['status', 'wamid', 'processed_at'])
                sent += 1

                # Deduct wallet
                wallet.balance -= rate_per_msg
                wallet.save(update_fields=['balance'])

                WalletTransaction.objects.create(
                    wallet=wallet,
                    client=client,
                    transaction_type='DEBIT',
                    amount=rate_per_msg,
                    balance_after=wallet.balance,
                    category=category,
                    description=f"Campaign '{campaign.name}' broadcast to {r.contact.phone_number}",
                    reference_id=wamid or f"CAMP-{campaign.id}-{r.id}",
                    status='SUCCESS'
                )

                UsageRecord.objects.create(
                    client=client,
                    whatsapp_account=account,
                    category=category,
                    meta_cost=Decimal('0.7000') if category == 'MARKETING' else Decimal('0.3000'),
                    platform_fee=Decimal('0.1000'),
                    tax_amount=Decimal('0.0500'),
                    total_cost=rate_per_msg
                )
            else:
                r.status = 'FAILED'
                r.error_message = res.get('error', 'Failed to deliver')
                r.processed_at = now
                r.save(update_fields=['status', 'error_message', 'processed_at'])
                failed += 1

        campaign.sent_count = sent
        campaign.failed_count = failed
        campaign.status = 'COMPLETED' if failed == 0 else ('FAILED' if sent == 0 else 'COMPLETED')
        campaign.save(update_fields=['sent_count', 'failed_count', 'status'])

        return Response({
            'message': f"Campaign execution completed. {sent} sent, {failed} failed.",
            'campaign': CampaignSerializer(campaign).data
        })
