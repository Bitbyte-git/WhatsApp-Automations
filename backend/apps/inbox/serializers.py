from rest_framework import serializers
from apps.inbox.models import Contact, Conversation, Message
from apps.whatsapp.serializers import WhatsAppAccountSerializer

class ContactSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = Contact
        fields = [
            'id', 'client', 'client_name', 'phone_number',
            'name', 'email', 'country_code', 'tags',
            'status', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_phone_number(self, value):
        cleaned = value.strip().replace(' ', '').replace('-', '')
        if not cleaned:
            raise serializers.ValidationError('Phone number cannot be empty.')
        return cleaned


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'client', 'whatsapp_account',
            'contact', 'wamid', 'direction', 'message_type',
            'content', 'media_url', 'media_caption', 'status',
            'error_code', 'error_message', 'sent_at', 'delivered_at',
            'read_at', 'raw_metadata', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'sent_at', 'delivered_at', 'read_at']


class ConversationSerializer(serializers.ModelSerializer):
    contact = ContactSerializer(read_only=True)
    whatsapp_account = WhatsAppAccountSerializer(read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'client', 'whatsapp_account', 'contact',
            'status', 'unread_count', 'last_message_at',
            'last_message_preview', 'assigned_agent',
            'last_message', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        last_msg = obj.messages.order_by('-created_at').first()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None


class SendMessageSerializer(serializers.Serializer):
    conversation_id = serializers.IntegerField(required=False)
    whatsapp_account_id = serializers.IntegerField(required=False)
    to_phone_number = serializers.CharField(required=False)
    message_type = serializers.ChoiceField(choices=Message.TYPE_CHOICES, default='TEXT')
    content = serializers.CharField(required=True, allow_blank=False)
    media_url = serializers.URLField(required=False, allow_blank=True)
    media_caption = serializers.CharField(required=False, allow_blank=True)
