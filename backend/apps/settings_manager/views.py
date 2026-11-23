from rest_framework import views, permissions, status, viewsets
from rest_framework.response import Response
from apps.settings_manager.models import PlatformSetting
from apps.settings_manager.serializers import PlatformSettingSerializer, NotificationSerializer
from apps.core.models import Notification
from apps.core.permissions import IsSuperAdminUser

class PlatformSettingsView(views.APIView):
    """
    Manages platform-wide configuration: BitByte company details,
    Meta App ID, App Secret, System User Token, and Webhook Verify Token.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        settings_qs = PlatformSetting.objects.all()

        # Seed defaults if not yet created
        defaults = [
            ('PLATFORM_NAME', 'BitByte WhatsApp SaaS Platform', 'Platform title', False),
            ('COMPANY_NAME', 'BitByte Technologies', 'Operating company name', False),
            ('SUPPORT_EMAIL', 'support@bitbytetech.org', 'Support email', False),
            ('META_APP_ID', '', 'Meta Developer App ID', False),
            ('META_APP_SECRET', '', 'Meta App Secret for webhook signature verification', True),
            ('META_VERIFY_TOKEN', 'bitbyte_whatsapp_webhook_token_secure', 'Webhook handshake verification token', False),
            ('META_GRAPH_VERSION', 'v21.0', 'Meta Graph API Version', False),
            ('DEFAULT_MARKETING_RATE', '0.85', 'Rate per marketing message (INR)', False),
            ('DEFAULT_UTILITY_RATE', '0.40', 'Rate per utility message (INR)', False),
            ('DEFAULT_SERVICE_RATE', '0.40', 'Rate per service conversation (INR)', False),
        ]

        for k, v, desc, sec in defaults:
            PlatformSetting.objects.get_or_create(
                key=k,
                defaults={'value': v, 'description': desc, 'is_secret': sec}
            )

        serialized = PlatformSettingSerializer(PlatformSetting.objects.all(), many=True).data
        return Response(serialized)

    def post(self, request):
        if not (request.user.is_superadmin):
            return Response({'error': 'Superadmin privileges required to modify platform settings.'}, status=status.HTTP_403_FORBIDDEN)

        key = request.data.get('key')
        value = request.data.get('value', '')
        description = request.data.get('description', '')
        is_secret = request.data.get('is_secret', False)

        if not key:
            return Response({'error': 'Key is required'}, status=status.HTTP_400_BAD_REQUEST)

        obj = PlatformSetting.set_setting(key, value, description=description, is_secret=is_secret)
        return Response(PlatformSettingSerializer(obj).data)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superadmin:
            return Notification.objects.all().order_by('-created_at')[:20]
        if user.client:
            return Notification.objects.filter(client=user.client).order_by('-created_at')[:20]
        return Notification.objects.none()
