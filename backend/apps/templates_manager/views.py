from rest_framework import viewsets, permissions, filters, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.templates_manager.models import MessageTemplate
from apps.templates_manager.serializers import MessageTemplateSerializer
from apps.whatsapp.models import WhatsAppAccount
from apps.whatsapp.meta_client import MetaCloudAPIClient

class MessageTemplateViewSet(viewsets.ModelViewSet):
    """
    WhatsApp Cloud API message template management.
    Never shows fake statuses; integrates directly with Meta Graph API when credentials exist.
    """
    serializer_class = MessageTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'body_text', 'category', 'language']
    ordering_fields = ['name', 'created_at', 'status', 'category']

    def get_queryset(self):
        user = self.request.user
        category = self.request.query_params.get('category')
        status_param = self.request.query_params.get('status')
        account_id = self.request.query_params.get('whatsapp_account_id')

        qs = MessageTemplate.objects.none()
        if user.is_superadmin:
            client_id = self.request.query_params.get('client_id')
            if client_id:
                qs = MessageTemplate.objects.filter(client_id=client_id)
            else:
                qs = MessageTemplate.objects.all()
        elif user.client:
            qs = MessageTemplate.objects.filter(client=user.client)

        if category:
            qs = qs.filter(category=category.upper())
        if status_param:
            qs = qs.filter(status=status_param.upper())
        if account_id:
            qs = qs.filter(whatsapp_account_id=account_id)

        return qs.select_related('client', 'whatsapp_account')

    def perform_create(self, serializer):
        user = self.request.user
        client = user.client if not user.is_superadmin else serializer.validated_data.get('client')
        serializer.save(client=client)

    @action(detail=False, methods=['post'])
    def sync_from_meta(self, request):
        """
        Synchronizes templates directly from Meta WABA.
        If WhatsApp integration is not configured, clearly reports status.
        """
        account_id = request.data.get('whatsapp_account_id')
        user = request.user

        account = None
        if account_id:
            account = WhatsAppAccount.objects.filter(id=account_id).first()
        elif user.client:
            account = WhatsAppAccount.objects.filter(client=user.client, connection_status='CONNECTED').first()
            if not account:
                account = WhatsAppAccount.objects.filter(client=user.client).first()

        if not account:
            return Response({
                'success': False,
                'configured': False,
                'error': 'No WhatsApp Account selected. Please configure a WhatsApp Account first.'
            }, status=status.HTTP_400_BAD_REQUEST)

        meta_client = MetaCloudAPIClient(
            phone_number_id=account.phone_number_id,
            access_token=account.access_token,
            waba_id=account.waba_id
        )

        if not meta_client.is_configured:
            return Response({
                'success': False,
                'configured': False,
                'error': 'WhatsApp integration is not configured. Missing Meta credentials or WABA ID.'
            }, status=status.HTTP_400_BAD_REQUEST)

        res = meta_client.fetch_templates()
        if not res.get('success'):
            return Response({
                'success': False,
                'error': res.get('error', 'Failed to fetch templates from Meta Cloud API'),
                'data': res.get('data')
            }, status=status.HTTP_400_BAD_REQUEST)

        meta_templates = res.get('templates', [])
        synced_count = 0
        for item in meta_templates:
            name = item.get('name')
            category = item.get('category', 'UTILITY')
            lang = item.get('language', 'en_US')
            meta_status = item.get('status', 'PENDING')
            template_id = item.get('id', '')

            # Extract body text from components
            body_text = ''
            header_text = ''
            header_type = 'NONE'
            footer_text = ''
            buttons = []

            for comp in item.get('components', []):
                ctype = comp.get('type')
                if ctype == 'BODY':
                    body_text = comp.get('text', '')
                elif ctype == 'HEADER':
                    header_type = comp.get('format', 'TEXT')
                    header_text = comp.get('text', '')
                elif ctype == 'FOOTER':
                    footer_text = comp.get('text', '')
                elif ctype == 'BUTTONS':
                    buttons = comp.get('buttons', [])

            MessageTemplate.objects.update_or_create(
                client=account.client,
                name=name,
                language=lang,
                defaults={
                    'whatsapp_account': account,
                    'category': category,
                    'status': meta_status,
                    'meta_template_id': template_id,
                    'header_type': header_type if header_type in dict(MessageTemplate.HEADER_CHOICES) else 'NONE',
                    'header_text': header_text,
                    'body_text': body_text or f"Template {name}",
                    'footer_text': footer_text,
                    'buttons': buttons
                }
            )
            synced_count += 1

        return Response({
            'success': True,
            'message': f'Synced {synced_count} templates from Meta Cloud API.',
            'count': synced_count
        })
