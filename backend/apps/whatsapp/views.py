from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.conf import settings
from apps.whatsapp.models import WhatsAppAccount, WebhookEvent
from apps.whatsapp.serializers import WhatsAppAccountSerializer, WebhookEventSerializer
from apps.whatsapp.meta_client import MetaCloudAPIClient

class WhatsAppAccountViewSet(viewsets.ModelViewSet):
    """
    CRUD and Meta status check for connected WhatsApp Accounts.
    Strict tenant isolation: non-superadmins only view/manage accounts belonging to their client.
    """
    serializer_class = WhatsAppAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superadmin:
            # Allow superadmin to filter by client if provided
            client_id = self.request.query_params.get('client_id')
            if client_id:
                return WhatsAppAccount.objects.filter(client_id=client_id).select_related('client')
            return WhatsAppAccount.objects.all().select_related('client')
        if user.client:
            return WhatsAppAccount.objects.filter(client=user.client).select_related('client')
        return WhatsAppAccount.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_superadmin and user.client:
            serializer.save(client=user.client)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def sync_status(self, request, pk=None):
        """
        Queries official Meta Graph API for quality rating and phone registration status.
        """
        account = self.get_object()
        client = MetaCloudAPIClient(
            phone_number_id=account.phone_number_id,
            access_token=account.access_token,
            waba_id=account.waba_id
        )

        if not client.is_configured:
            return Response({
                'configured': False,
                'message': 'WhatsApp integration is not configured. Missing Meta credentials or Phone Number ID.'
            }, status=status.HTTP_400_BAD_REQUEST)

        result = client.check_phone_number_status()
        if result['success']:
            details = result['details']
            rating = details.get('quality_rating', account.quality_rating)
            if rating in dict(WhatsAppAccount.QUALITY_CHOICES):
                account.quality_rating = rating
            account.connection_status = 'CONNECTED'
            account.save(update_fields=['quality_rating', 'connection_status'])
            return Response({
                'success': True,
                'details': details,
                'account': WhatsAppAccountSerializer(account).data
            })
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)


class MetaConfigStatusView(views.APIView):
    """
    Returns the platform-wide and tenant-specific Meta WhatsApp integration readiness.
    Accurately indicates whether Meta credentials are configured.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        has_global_token = bool(getattr(settings, 'META_SYSTEM_USER_TOKEN', ''))
        app_id = getattr(settings, 'META_APP_ID', '')
        verify_token = getattr(settings, 'META_VERIFY_TOKEN', '')
        infisq_configured = bool(getattr(settings, 'INFISQ_WA_API_KEY', ''))

        user = request.user
        accounts_count = 0
        connected_count = 0

        if user.is_superadmin:
            accounts_count = WhatsAppAccount.objects.count()
            connected_count = WhatsAppAccount.objects.filter(connection_status='CONNECTED').count()
        elif user.client:
            accounts_count = WhatsAppAccount.objects.filter(client=user.client).count()
            connected_count = WhatsAppAccount.objects.filter(client=user.client, connection_status='CONNECTED').count()

        is_configured = bool(has_global_token or infisq_configured or accounts_count > 0)
        status_message = 'Active' if is_configured else 'WhatsApp integration is not configured.'
        if infisq_configured:
            status_message = 'Infisq WhatsApp Gateway is active (wa.infisq.com)'
        elif has_global_token:
            status_message = 'Meta Cloud API is active'

        return Response({
            'is_configured': is_configured,
            'status_message': status_message,
            'gateway_provider': 'INFISQ' if infisq_configured else ('META' if has_global_token else 'NONE'),
            'infisq_gateway_configured': infisq_configured,
            'meta_app_id_configured': bool(app_id),
            'meta_verify_token_configured': bool(verify_token),
            'meta_system_token_configured': has_global_token,
            'total_accounts': accounts_count,
            'connected_accounts': connected_count,
            'webhook_callback_url': request.build_absolute_uri('/api/webhooks/whatsapp/'),
        })
