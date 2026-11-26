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

    @action(detail=False, methods=['get'])
    def meta_balance(self, request):
        """
        Returns real Meta WABA pricing_analytics spend & volume breakdown for Superadmin.
        """
        if not request.user.is_superadmin:
            return Response({'error': 'Superadmin access required.'}, status=status.HTTP_403_FORBIDDEN)

        days = int(request.query_params.get('days', 30) or 30)
        account = (
            WhatsAppAccount.objects.filter(connection_status='CONNECTED')
            .exclude(waba_id__startswith='infisq')
            .first()
            or WhatsAppAccount.objects.filter(connection_status='CONNECTED').first()
        )
        if not account or not str(account.waba_id or '').isdigit():
            return Response({'error': 'No connected Meta WABA account found.'}, status=status.HTTP_400_BAD_REQUEST)

        meta_client = MetaCloudAPIClient(
            phone_number_id=account.phone_number_id,
            access_token=account.access_token,
            waba_id=account.waba_id
        )
        res = meta_client.fetch_pricing_analytics(days=days)
        if not res.get('success'):
            return Response({'error': res.get('error', 'Failed to fetch Meta analytics')}, status=status.HTTP_400_BAD_REQUEST)

        raw = res['data']
        points = []
        for block in raw.get('pricing_analytics', {}).get('data', []):
            points.extend(block.get('data_points', []))

        summary = {
            'MARKETING': {'volume': 0, 'cost': 0.0},
            'UTILITY': {'volume': 0, 'cost': 0.0},
            'AUTHENTICATION': {'volume': 0, 'cost': 0.0},
            'SERVICE': {'volume': 0, 'cost': 0.0},
        }
        for pt in points:
            cat = str(pt.get('pricing_category', 'SERVICE')).upper()
            if cat not in summary:
                summary[cat] = {'volume': 0, 'cost': 0.0}
            summary[cat]['volume'] += int(pt.get('volume', 0) or 0)
            summary[cat]['cost'] += float(pt.get('cost', 0) or 0.0)

        total_cost = sum(v['cost'] for v in summary.values())
        total_volume = sum(v['volume'] for v in summary.values())

        return Response({
            'waba_id': raw.get('id', account.waba_id),
            'waba_name': raw.get('name', account.business_name),
            'phone_number': account.phone_number,
            'currency': raw.get('currency', 'INR'),
            'days': days,
            'total_cost': round(total_cost, 4),
            'total_volume': total_volume,
            'breakdown': {
                k: {'volume': v['volume'], 'cost': round(v['cost'], 4)}
                for k, v in summary.items()
            },
            'meta_billing_url': 'https://business.facebook.com/billing_hub/accounts',
        })


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
