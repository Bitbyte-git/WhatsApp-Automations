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

    @action(detail=False, methods=['post'], url_path='request_otp')
    def request_otp(self, request):
        """
        Dispatches a 6-digit SMS/Voice OTP via Meta Cloud API to verify and onboard a client's WhatsApp number.
        Returns friendly guidance if phone is active on mobile WhatsApp (Meta error 133010).
        """
        phone_number = request.data.get('phone_number', '').strip()
        business_name = request.data.get('business_name', '').strip()
        code_method = request.data.get('code_method', 'SMS').upper()
        phone_number_id = request.data.get('phone_number_id', '').strip()

        if not phone_number:
            return Response({'error': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        clean_phone = phone_number.replace(' ', '').replace('-', '')
        if not clean_phone.startswith('+') and len(clean_phone) == 10:
            clean_phone = '+91' + clean_phone

        user = request.user
        account = None
        if user.client:
            account = WhatsAppAccount.objects.filter(client=user.client).first()

        access_token = (account.access_token if account and account.access_token else None) or getattr(settings, 'META_SYSTEM_USER_TOKEN', '')
        waba_id = getattr(settings, 'META_WABA_ID', '')
        target_phone_number_id = phone_number_id

        meta_client = MetaCloudAPIClient(
            phone_number_id=target_phone_number_id,
            access_token=access_token,
            waba_id=waba_id
        )

        # If phone_number_id is not yet registered for this new number, attach it to WABA first
        if not target_phone_number_id:
            waba_res = meta_client.add_phone_number_to_waba(clean_phone, business_name or 'Business Partner')
            if waba_res.get('already_registered_on_mobile'):
                return Response({
                    'success': False,
                    'already_registered_on_mobile': True,
                    'error': waba_res.get('error'),
                    'instruction': 'This number is currently active on your mobile WhatsApp app. To connect to Cloud API, open WhatsApp on your phone -> Settings -> Account -> Delete my account. Or use a fresh SIM number.'
                }, status=status.HTTP_400_BAD_REQUEST)
            elif waba_res.get('success'):
                target_phone_number_id = waba_res.get('phone_number_id')
                meta_client.phone_number_id = target_phone_number_id
            else:
                target_phone_number_id = (account.phone_number_id if account else None) or getattr(settings, 'META_PHONE_NUMBER_ID', '')
                meta_client.phone_number_id = target_phone_number_id

        # Check if already registered and verified on Meta Cloud API
        if target_phone_number_id:
            status_res = meta_client.check_phone_number_status()
            if status_res.get('success'):
                details = status_res.get('details', {})
                if details.get('code_verification_status') == 'VERIFIED':
                    if user.client:
                        account_obj, _ = WhatsAppAccount.objects.get_or_create(
                            client=user.client,
                            defaults={
                                'business_name': business_name or details.get('verified_name') or user.client.name,
                                'phone_number': clean_phone,
                                'phone_number_id': target_phone_number_id,
                                'waba_id': waba_id or getattr(settings, 'META_WABA_ID', 'default_waba'),
                                'connection_status': 'CONNECTED',
                                'quality_rating': details.get('quality_rating') or 'GREEN',
                                'is_default': True,
                            }
                        )
                        account_obj.connection_status = 'CONNECTED'
                        account_obj.quality_rating = details.get('quality_rating') or 'GREEN'
                        account_obj.phone_number = clean_phone
                        account_obj.phone_number_id = target_phone_number_id
                        if business_name:
                            account_obj.business_name = business_name
                        account_obj.is_default = True
                        account_obj.save()

                    return Response({
                        'success': True,
                        'already_verified': True,
                        'message': f'WhatsApp Business number {clean_phone} is already verified and connected successfully!',
                        'phone_number': clean_phone,
                        'phone_number_id': target_phone_number_id,
                        'quality_rating': details.get('quality_rating') or 'GREEN',
                        'connection_status': 'CONNECTED'
                    })

        result = meta_client.request_phone_code(code_method=code_method)

        if result.get('success'):
            return Response({
                'success': True,
                'message': f'Verification OTP sent via {code_method} to {clean_phone}. Please enter the 6-digit code.',
                'phone_number': clean_phone,
                'phone_number_id': target_phone_number_id
            })

        if result.get('already_registered_on_mobile'):
            return Response({
                'success': False,
                'already_registered_on_mobile': True,
                'error': result.get('error'),
                'instruction': 'Sorry! This phone number is already active on WhatsApp. Please provide a new phone number that is not on WhatsApp, or delete the current WhatsApp account on this number.'
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'success': False,
            'error': result.get('error', 'Failed to request OTP from Meta Cloud API.')
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='verify_otp')
    def verify_otp(self, request):
        """
        Submits the 6-digit OTP code to Meta Cloud API to verify and register the phone number.
        Marks WhatsAppAccount as CONNECTED with Green quality.
        """
        phone_number = request.data.get('phone_number', '').strip()
        code = request.data.get('code', '').strip()
        pin = request.data.get('pin', '123456').strip()
        business_name = request.data.get('business_name', '').strip()
        phone_number_id = request.data.get('phone_number_id', '').strip()

        if not code or len(code) != 6:
            return Response({'error': 'Please provide the valid 6-digit verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        clean_phone = phone_number.replace(' ', '').replace('-', '')
        if not clean_phone.startswith('+') and len(clean_phone) == 10:
            clean_phone = '+91' + clean_phone

        user = request.user
        account = None
        if user.client:
            account = WhatsAppAccount.objects.filter(client=user.client).first()

        target_phone_number_id = phone_number_id or (account.phone_number_id if account else None) or getattr(settings, 'META_PHONE_NUMBER_ID', '')
        access_token = (account.access_token if account and account.access_token else None) or getattr(settings, 'META_SYSTEM_USER_TOKEN', '')

        meta_client = MetaCloudAPIClient(
            phone_number_id=target_phone_number_id,
            access_token=access_token,
            waba_id=getattr(settings, 'META_WABA_ID', '')
        )

        result = meta_client.register_phone_number(pin=pin, code=code)

        if result.get('success'):
            if user.client:
                account_obj, _ = WhatsAppAccount.objects.get_or_create(
                    client=user.client,
                    defaults={
                        'business_name': business_name or user.client.name,
                        'phone_number': clean_phone,
                        'phone_number_id': target_phone_number_id or f"meta_{clean_phone}",
                        'waba_id': getattr(settings, 'META_WABA_ID', 'default_waba'),
                        'connection_status': 'CONNECTED',
                        'quality_rating': 'GREEN',
                        'is_default': True,
                    }
                )
                account_obj.connection_status = 'CONNECTED'
                account_obj.quality_rating = 'GREEN'
                account_obj.phone_number = clean_phone
                if business_name:
                    account_obj.business_name = business_name
                account_obj.is_default = True
                account_obj.save()

            return Response({
                'success': True,
                'message': f'WhatsApp Business number {clean_phone} connected successfully!',
                'phone_number': clean_phone,
                'quality_rating': 'GREEN',
                'connection_status': 'CONNECTED'
            })

        return Response({
            'success': False,
            'error': result.get('error', 'Failed to verify OTP code with Meta.')
        }, status=status.HTTP_400_BAD_REQUEST)

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
