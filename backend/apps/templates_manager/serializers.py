from rest_framework import serializers
from apps.templates_manager.models import MessageTemplate
from apps.whatsapp.serializers import WhatsAppAccountSerializer

class MessageTemplateSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    whatsapp_account_name = serializers.CharField(source='whatsapp_account.business_name', read_only=True)

    class Meta:
        model = MessageTemplate
        fields = [
            'id', 'client', 'client_name', 'whatsapp_account',
            'whatsapp_account_name', 'name', 'category', 'language',
            'status', 'header_type', 'header_text', 'body_text',
            'footer_text', 'buttons', 'meta_template_id',
            'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'client', 'created_at', 'updated_at']

    def validate_name(self, value):
        cleaned = value.strip().lower()
        if not cleaned.replace('_', '').isalnum():
            raise serializers.ValidationError('Template name can only contain lowercase alphanumeric characters and underscores.')
        return cleaned
