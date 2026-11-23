from rest_framework import serializers
from apps.campaigns.models import Campaign, CampaignRecipient
from apps.templates_manager.serializers import MessageTemplateSerializer
from apps.whatsapp.serializers import WhatsAppAccountSerializer

class CampaignRecipientSerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(source='contact.name', read_only=True)
    contact_phone = serializers.CharField(source='contact.phone_number', read_only=True)

    class Meta:
        model = CampaignRecipient
        fields = ['id', 'campaign', 'contact', 'contact_name', 'contact_phone', 'status', 'wamid', 'error_message', 'processed_at']
        read_only_fields = ['id', 'processed_at']


class CampaignSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    whatsapp_account_name = serializers.CharField(source='whatsapp_account.business_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    template_details = MessageTemplateSerializer(source='template', read_only=True)

    class Meta:
        model = Campaign
        fields = [
            'id', 'client', 'client_name', 'whatsapp_account',
            'whatsapp_account_name', 'template', 'template_name',
            'template_details', 'name', 'scheduled_at', 'status',
            'total_recipients', 'sent_count', 'delivered_count',
            'read_count', 'failed_count', 'template_params',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'sent_count', 'delivered_count', 'read_count',
            'failed_count', 'created_at', 'updated_at'
        ]


class CreateCampaignSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    whatsapp_account_id = serializers.IntegerField()
    template_id = serializers.IntegerField()
    contact_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    scheduled_at = serializers.DateTimeField(required=False, allow_null=True)
    template_params = serializers.DictField(required=False, default=dict)
