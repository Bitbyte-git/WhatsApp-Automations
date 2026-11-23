from django.db import models

class PlatformSetting(models.Model):
    """
    Global platform configuration for BitByte Technologies WhatsApp SaaS,
    including Meta App credentials, default rates, and system switches.
    """
    key = models.CharField(max_length=100, unique=True, db_index=True)
    value = models.TextField(blank=True)
    description = models.CharField(max_length=255, blank=True)
    is_secret = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key

    @classmethod
    def get_setting(cls, key, default=''):
        obj = cls.objects.filter(key=key).first()
        return obj.value if obj else default

    @classmethod
    def set_setting(cls, key, value, description='', is_secret=False):
        obj, _ = cls.objects.update_or_create(
            key=key,
            defaults={'value': value, 'description': description, 'is_secret': is_secret}
        )
        return obj
