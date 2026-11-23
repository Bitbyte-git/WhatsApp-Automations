from rest_framework import serializers
from apps.whatsapp.models import WhatsAppAccount, WebhookEvent
from apps.clients.serializers import ClientSerializer

class WhatsAppAccountSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    has_custom_token = serializers.SerializerMethodField()

    class Meta:
        model = WhatsAppAccount
        fields = [
            'id', 'client', 'client_name', 'business_name',
            'waba_id', 'phone_number', 'phone_number_id',
            'display_phone_number', 'quality_rating', 'connection_status',
            'account_status', 'is_default', 'access_token',
            'has_custom_token', 'webhook_verified', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'has_custom_token']
        extra_kwargs = {
            'access_token': {'write_only': True, 'required': False}
        }

    def get_has_custom_token(self, obj):
        return bool(obj.access_token)


class WebhookEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookEvent
        fields = ['id', 'event_id', 'event_type', 'whatsapp_account', 'payload', 'status', 'error_message', 'received_at', 'processed_at']
        read_only_fields = ['id', 'received_at']
