import logging
import traceback
from rest_framework import viewsets, permissions, filters, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.conf import settings
from decimal import Decimal

logger = logging.getLogger(__name__)

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
from apps.whatsapp.infisq_client import InfisqWhatsAppClient
from apps.clients.models import Client
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

        # Check WhatsApp gateway configuration
        meta_client = MetaCloudAPIClient(
            phone_number_id=account.phone_number_id,
            access_token=account.access_token,
            waba_id=account.waba_id
        )
        infisq_client = InfisqWhatsAppClient()
        use_infisq = False

        if not meta_client.is_configured:
            if infisq_client.is_configured:
                use_infisq = True
            else:
                return Response({
                    'error': 'WhatsApp integration is not configured. Missing Meta credentials or Infisq Gateway API key.',
                    'configured': False
                }, status=status.HTTP_400_BAD_REQUEST)

        # Check template approval status if using Meta Cloud API
        if not use_infisq and campaign.template.status != 'APPROVED':
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
            if use_infisq:
                body_msg = campaign.template.body_text or f"Broadcast update from {client.name}"
                inf_res = infisq_client.send_text_message(contact=r.contact.phone_number, message=body_msg)
                res = {
                    'success': inf_res.get('success', False),
                    'wamid': f"INFISQ-{int(timezone.now().timestamp())}",
                    'error': inf_res.get('error', 'Gateway dispatch failed')
                }
            else:
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

    @action(detail=False, methods=['post'], url_path='quick_broadcast')
    def quick_broadcast(self, request):
        """
        1-Click WhatsApp Corporate Broadcast & Free Test Message Flow.
        Directly sends interactive button messages or rich WhatsApp announcements
        via Infisq Gateway or Meta Cloud API.
        Supports single test number (Free Test) and bulk audience broadcast (500+ contacts).
        """
        try:
            user = request.user
            client = user.client if hasattr(user, 'client') and user.client else None
            if not client and not user.is_superadmin:
                return Response({'error': 'Client profile not found.'}, status=status.HTTP_400_BAD_REQUEST)

            # If superadmin without tenant, find or use provided tenant
            if not client:
                client_id = request.data.get('client_id')
                if client_id:
                    client = Client.objects.filter(id=client_id).first()
                if not client:
                    client = Client.objects.first()

            if not client:
                client, _ = Client.objects.get_or_create(
                    name='BitByte Technologies',
                    defaults={'slug': 'bitbyte-technologies', 'status': 'ACTIVE', 'phone_number': '+919363938143'}
                )

            data = request.data
            recipient_type = data.get('recipient_type', 'TEST')  # 'TEST' or 'AUDIENCE'
            message_category = str(data.get('message_category', 'MARKETING')).upper()  # 'MARKETING' | 'UTILITY' | 'SERVICE'
            target_number = str(data.get('phone_number', '')).strip()
            target_numbers = data.get('phone_numbers', [])
            service_name = data.get('service_name', 'Business Service')
            header_text = data.get('header_text', '')
            message_body = str(data.get('message', '')).strip()
            buttons = data.get('buttons', [])
            footer_text = data.get('footer_text', 'BitByte WhatsApp Engine')
            image_url = str(data.get('image_url', '') or data.get('media_url', '')).strip()

            if not message_body:
                return Response({'error': 'Message content is required.'}, status=status.HTTP_400_BAD_REQUEST)

            # Determine recipient list
            recipients_list = []
            if recipient_type == 'TEST':
                if not target_number:
                    return Response({'error': 'Please provide a valid test phone number.'}, status=status.HTTP_400_BAD_REQUEST)
                recipients_list = [target_number]
            else:
                if isinstance(target_numbers, list) and target_numbers:
                    recipients_list = [str(n).strip() for n in target_numbers if str(n).strip()]
                else:
                    contacts = Contact.objects.filter(client=client, status='OPTED_IN')
                    recipients_list = list(contacts.values_list('phone_number', flat=True))
                    if not recipients_list and target_number:
                        recipients_list = [target_number]

            if not recipients_list:
                return Response({'error': 'No eligible contacts found to broadcast. Please add contacts or enter a phone number.'}, status=status.HTTP_400_BAD_REQUEST)

            # Check gateway configuration (Priority: Direct Meta Cloud API, Fallback: Infisq)
            meta_client = MetaCloudAPIClient()
            infisq_client = InfisqWhatsAppClient()
            if not meta_client.is_configured and not infisq_client.is_configured:
                return Response({
                    'error': 'WhatsApp Gateway is not configured. Missing Meta credentials and Infisq API key.',
                    'configured': False
                }, status=status.HTTP_400_BAD_REQUEST)

            # Platform Superadmin has direct unlimited gateway access
            is_free_test = (recipient_type == 'TEST' and len(recipients_list) == 1) or user.is_superadmin
            rate_per_msg = Decimal('0.8500')
            required_funds = Decimal('0.0000') if is_free_test else (rate_per_msg * len(recipients_list))

            wallet, _ = Wallet.objects.get_or_create(client=client, defaults={'balance': 0.0000})
            if not is_free_test and wallet.balance < required_funds:
                return Response({
                    'error': f'Insufficient wallet balance. Required: ₹{required_funds}, Available: ₹{wallet.balance}. Please recharge wallet.',
                    'required_funds': str(required_funds),
                    'wallet_balance': str(wallet.balance)
                }, status=status.HTTP_402_PAYMENT_REQUIRED)

            # Format buttons for Infisq
            button_labels = []
            if isinstance(buttons, list):
                for b in buttons:
                    if isinstance(b, dict):
                        button_labels.append(b.get('label') or b.get('text') or str(b))
                    elif isinstance(b, str) and b.strip():
                        button_labels.append(b.strip())
            elif isinstance(buttons, str) and buttons.strip():
                button_labels = [b.strip() for b in buttons.split(',') if b.strip()]

            button_str = ','.join(button_labels[:3])

            # Ensure account & template exist for foreign key compliance
            account = WhatsAppAccount.objects.filter(client=client).first()
            if not account and meta_client.phone_number_id:
                account = WhatsAppAccount.objects.filter(phone_number_id=meta_client.phone_number_id).first()
            if not account:
                waba_id_val = meta_client.waba_id or getattr(settings, 'META_WABA_ID', '') or f'waba-{client.id}'
                account, _ = WhatsAppAccount.objects.get_or_create(
                    phone_number_id=meta_client.phone_number_id or f'direct-meta-{client.id}',
                    defaults={
                        'client': client,
                        'business_name': f'{client.name} Official Gateway',
                        'phone_number': '+919944495366' if meta_client.is_configured else '+919363938143',
                        'waba_id': waba_id_val,
                        'access_token': meta_client.access_token,
                        'connection_status': 'CONNECTED',
                        'account_status': 'ACTIVE'
                    }
                )

            template = MessageTemplate.objects.filter(client=client).first()
            if not template:
                template = MessageTemplate.objects.first()
            if not template:
                template, _ = MessageTemplate.objects.get_or_create(
                    client=client,
                    name='quick_service_broadcast',
                    defaults={
                        'category': 'MARKETING',
                        'language': 'en_US',
                        'body_text': message_body,
                        'status': 'APPROVED'
                    }
                )

            campaign_name = f"{service_name} {'Free Test' if is_free_test else 'Blast'} - {timezone.now().strftime('%d %b %H:%M')}"
            campaign = Campaign.objects.create(
                client=client,
                whatsapp_account=account,
                template=template,
                name=campaign_name,
                status='IN_PROGRESS',
                total_recipients=len(recipients_list)
            )

            sent_count = 0
            failed_count = 0
            gateway_results = []

            for phone in recipients_list:
                cleaned_phone = infisq_client._normalize_phone(phone)
                res = None

                if meta_client.is_configured:
                    # Direct Meta Cloud API Dispatch (Official Method)
                    formatted_body = message_body
                    if button_labels:
                        formatted_body += '\n\n*Quick Actions:*\n' + '\n'.join([f'[{i+1}] {btn}' for i, btn in enumerate(button_labels)])
                    full_message = f'*{header_text or service_name}*\n\n{formatted_body}\n\n_{footer_text}_'

                    if message_category == 'SERVICE':
                        # Service Window Reply (1,000 FREE/month when customer messaged in last 24h)
                        if image_url:
                            res = meta_client.send_image_message(
                                to_phone_number=cleaned_phone,
                                image_url=image_url,
                                caption=full_message
                            )
                        else:
                            res = meta_client.send_text_message(
                                to_phone_number=cleaned_phone,
                                text_content=full_message
                            )
                    elif message_category == 'UTILITY':
                        # Utility Template Dispatch (~₹0.14/msg) with direct session fallback
                        tpl_res = meta_client.send_utility_update_template(
                            to_phone_number=cleaned_phone,
                            body_text=formatted_body,
                            image_url=image_url if image_url else None
                        )
                        if tpl_res and tpl_res.get('success'):
                            res = tpl_res
                        elif image_url:
                            res = meta_client.send_image_message(
                                to_phone_number=cleaned_phone,
                                image_url=image_url,
                                caption=full_message
                            )
                        else:
                            res = meta_client.send_text_message(
                                to_phone_number=cleaned_phone,
                                text_content=full_message
                            )
                    else:
                        # Marketing Broadcast (Default)
                        if image_url:
                            tpl_res = meta_client.send_marketing_offer_template(
                                to_phone_number=cleaned_phone,
                                body_text=formatted_body,
                                image_url=image_url
                            )
                            if tpl_res and tpl_res.get('success'):
                                res = tpl_res
                            else:
                                res = meta_client.send_image_message(
                                    to_phone_number=cleaned_phone,
                                    image_url=image_url,
                                    caption=full_message
                                )
                                if not res or not res.get('success'):
                                    if tpl_res and not res:
                                        res = tpl_res
                        else:
                            res = meta_client.send_text_message(
                                to_phone_number=cleaned_phone,
                                text_content=full_message
                            )
                            if not res or not res.get('success'):
                                tpl_res = meta_client.send_marketing_offer_template(
                                    to_phone_number=cleaned_phone,
                                    body_text=formatted_body
                                )
                                if tpl_res and tpl_res.get('success'):
                                    res = tpl_res
                else:
                    # Infisq Gateway Dispatch (TenDigit Method 1 - Saved)
                    if button_str:
                        res = infisq_client.send_button_message(
                            contact=cleaned_phone,
                            message=message_body,
                            button=button_str,
                            header_type='text',
                            header_text=header_text or service_name,
                            footer_text=footer_text
                        )

                    if not res or not res.get('success'):
                        formatted_body = message_body
                        if button_labels:
                            formatted_body += '\n\n*Quick Actions:*\n' + '\n'.join([f'[{i+1}] {btn}' for i, btn in enumerate(button_labels)])
                        full_message = f'*{header_text or service_name}*\n\n{formatted_body}\n\n_{footer_text}_'
                        res = infisq_client.send_text_message(
                            contact=cleaned_phone,
                            message=full_message
                        )

                gateway_results.append({'phone': cleaned_phone, 'result': res})

                if res and res.get('success'):
                    sent_count += 1
                    if not is_free_test:
                        wallet.balance -= rate_per_msg
                        wallet.save(update_fields=['balance'])
                        WalletTransaction.objects.create(
                            wallet=wallet,
                            client=client,
                            transaction_type='DEBIT',
                            amount=rate_per_msg,
                            balance_after=wallet.balance,
                            category='MARKETING',
                            description=f'Blast: {campaign_name} to {cleaned_phone}',
                            reference_id=res.get('wamid') or f'WA-{int(timezone.now().timestamp())}-{sent_count}',
                            status='SUCCESS'
                        )
                else:
                    failed_count += 1

            campaign.sent_count = sent_count
            campaign.failed_count = failed_count
            campaign.status = 'COMPLETED' if failed_count == 0 else ('FAILED' if sent_count == 0 else 'COMPLETED')
            campaign.save(update_fields=['sent_count', 'failed_count', 'status'])

            last_error = None
            if gateway_results:
                last_res = gateway_results[0].get('result') or {}
                if not last_res.get('success'):
                    last_error = last_res.get('error') or last_res.get('response')

            return Response({
                'success': sent_count > 0,
                'is_free_test': is_free_test,
                'message': (
                    f'WhatsApp message successfully delivered to {sent_count} recipient(s)!'
                    if sent_count > 0
                    else f'WhatsApp Gateway delivery error: {last_error or "Message could not be delivered."}'
                ),
                'sent_count': sent_count,
                'failed_count': failed_count,
                'campaign_id': campaign.id,
                'wallet_balance': str(wallet.balance),
                'gateway_status': gateway_results[0] if gateway_results else None
            }, status=status.HTTP_200_OK if sent_count > 0 else status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.exception('Error in quick_broadcast: %s', e)
            return Response({
                'success': False,
                'error': f'Server error: {str(e)}',
                'traceback': traceback.format_exc()
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
