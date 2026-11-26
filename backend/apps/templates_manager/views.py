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

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        user = request.user
        account = validated.get('whatsapp_account')
        if not account and user.client:
            account = WhatsAppAccount.objects.filter(client=user.client, connection_status='CONNECTED').first() or WhatsAppAccount.objects.filter(client=user.client).first()
        if not account and user.is_superadmin:
            client_obj = validated.get('client')
            if client_obj:
                account = WhatsAppAccount.objects.filter(client=client_obj, connection_status='CONNECTED').first() or WhatsAppAccount.objects.filter(client=client_obj).first()
            else:
                account = WhatsAppAccount.objects.filter(connection_status='CONNECTED').exclude(waba_id__startswith='infisq').first() or WhatsAppAccount.objects.filter(connection_status='CONNECTED').first()

        if not account:
            return Response(
                {'error': 'No connected WhatsApp Account found. Please connect a WhatsApp Gateway first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        meta_client = MetaCloudAPIClient(
            phone_number_id=account.phone_number_id,
            access_token=account.access_token,
            waba_id=account.waba_id
        )
        if not meta_client.is_configured:
            return Response(
                {'error': 'WhatsApp integration is not configured. Missing Meta credentials or WABA ID.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        meta_res = meta_client.create_template(
            name=validated['name'],
            category=validated['category'],
            language=validated.get('language', 'en_US'),
            body_text=validated['body_text'],
            header_text=validated.get('header_text', ''),
            footer_text=validated.get('footer_text', ''),
            buttons=validated.get('buttons', []),
        )
        if not meta_res.get('success'):
            return Response(
                {'error': meta_res.get('error', 'Meta rejected template submission.')},
                status=status.HTTP_400_BAD_REQUEST
            )

        instance = serializer.save(
            client=account.client,
            whatsapp_account=account,
            meta_template_id=meta_res.get('meta_template_id', ''),
            status=meta_res.get('status', 'PENDING'),
            category=meta_res.get('category', validated['category']),
        )
        out_serializer = self.get_serializer(instance)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def send_otp(self, request, pk=None):
        """
        Dispatches a one-time verification code using an approved AUTHENTICATION template.
        """
        import random
        template = self.get_object()
        if template.category != 'AUTHENTICATION':
            return Response({'error': 'Only AUTHENTICATION templates can send OTPs.'}, status=status.HTTP_400_BAD_REQUEST)
        if template.status != 'APPROVED':
            return Response({'error': f"Template '{template.name}' is currently {template.status}. Wait for Meta approval first."}, status=status.HTTP_400_BAD_REQUEST)

        raw_phone = str(request.data.get('phone_number', '')).strip()
        digits = ''.join(ch for ch in raw_phone if ch.isdigit())
        if len(digits) == 10:
            digits = f'91{digits}'
        if len(digits) < 11:
            return Response({'error': 'Enter a valid 10-digit or country-code WhatsApp phone number.'}, status=status.HTTP_400_BAD_REQUEST)

        otp_code = str(request.data.get('otp_code', '')).strip() or f'{random.randint(100000, 999999)}'

        account = template.whatsapp_account
        if not account:
            account = WhatsAppAccount.objects.filter(client=template.client, connection_status='CONNECTED').first()
        if not account:
            return Response({'error': 'No connected WhatsApp Account found.'}, status=status.HTTP_400_BAD_REQUEST)

        meta_client = MetaCloudAPIClient(
            phone_number_id=account.phone_number_id,
            access_token=account.access_token,
            waba_id=account.waba_id
        )
        res = meta_client.send_authentication_otp_template(
            to_phone_number=digits,
            otp_code=otp_code,
            template_name=template.name,
            language_code=template.language or 'en'
        )
        if not res.get('success'):
            return Response({'error': res.get('error', 'Failed to send OTP via Meta.')}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': True,
            'otp_code': otp_code,
            'phone_number': f'+{digits}',
            'wamid': res.get('wamid', ''),
            'message': f'OTP {otp_code} sent to +{digits}!',
        })

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
