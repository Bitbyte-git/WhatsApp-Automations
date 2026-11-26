from django.core.management.base import BaseCommand
from apps.authentication.models import User
from apps.settings_manager.models import PlatformSetting

class Command(BaseCommand):
    help = 'Seeds initial superadmin and platform settings for BitByte Technologies WhatsApp SaaS.'

    def handle(self, *args, **options):
        # 1. Primary Superadmin User (Senthilkumar S)
        admin_email = 'bitbyte.senthil@gmail.com'
        admin_pass = 'Senthil@2003'
        admin, created = User.objects.get_or_create(
            email=admin_email,
            defaults={
                'full_name': 'Senthilkumar S (BitByte Founder)',
                'phone_number': '+919944495366',
                'is_staff': True,
                'is_superuser': True,
                'role': 'SUPERADMIN'
            }
        )
        admin.set_password(admin_pass)
        admin.is_staff = True
        admin.is_superuser = True
        admin.role = 'SUPERADMIN'
        admin.save()
        self.stdout.write(self.style.SUCCESS(f"Superadmin configured: {admin_email}"))

        # Also ensure legacy admin if needed
        legacy_email = 'admin@bitbytetech.org'
        if not User.objects.filter(email=legacy_email).exists():
            User.objects.create_superuser(
                email=legacy_email,
                password='ChangeMe@123',
                full_name='BitByte System Admin',
                phone_number='+919876543210'
            )

        # 2. Platform Settings
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

        self.stdout.write(self.style.SUCCESS("Platform settings initialized successfully."))
