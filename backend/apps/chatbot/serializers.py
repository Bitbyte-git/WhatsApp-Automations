from rest_framework import serializers
from apps.chatbot.models import ChatbotConfiguration, KnowledgeDocument

class KnowledgeDocumentSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = KnowledgeDocument
        fields = [
            'id', 'client', 'client_name', 'chatbot',
            'title', 'content_type', 'content', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'client': {'required': False},
        }


class ChatbotConfigSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    whatsapp_account_name = serializers.CharField(source='whatsapp_account.business_name', read_only=True)
    documents_count = serializers.IntegerField(source='knowledge_documents.count', read_only=True)

    class Meta:
        model = ChatbotConfiguration
        fields = [
            'id', 'client', 'client_name', 'whatsapp_account',
            'whatsapp_account_name', 'is_enabled', 'provider',
            'model_name', 'system_prompt', 'welcome_message',
            'fallback_message', 'handover_enabled', 'handover_keywords',
            'handover_message', 'max_tokens', 'temperature',
            'interactive_flow', 'documents_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'client': {'required': False},
        }


class SimulateChatSerializer(serializers.Serializer):
    message = serializers.CharField(required=True)
    history = serializers.ListField(child=serializers.DictField(), required=False, default=list)
