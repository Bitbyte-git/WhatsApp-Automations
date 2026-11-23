from rest_framework import serializers
from apps.settings_manager.models import PlatformSetting
from apps.core.models import Notification

class PlatformSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSetting
        fields = ['id', 'key', 'value', 'description', 'is_secret', 'updated_at']
        read_only_fields = ['id', 'updated_at']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Mask sensitive keys if secret
        if instance.is_secret and instance.value:
            ret['value'] = f"••••••••••••{instance.value[-4:]}" if len(instance.value) > 4 else "••••••••"
        return ret


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'client', 'user', 'title', 'message', 'notification_type', 'is_read', 'link', 'created_at']
        read_only_fields = ['id', 'created_at']
