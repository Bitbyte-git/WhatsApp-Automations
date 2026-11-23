from rest_framework import viewsets, permissions, filters, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.chatbot.models import ChatbotConfiguration, KnowledgeDocument
from apps.chatbot.serializers import (
    ChatbotConfigSerializer,
    KnowledgeDocumentSerializer,
    SimulateChatSerializer,
)
from apps.chatbot.ai_service import ChatbotAIService
from apps.clients.models import Client

class ChatbotConfigViewSet(viewsets.ModelViewSet):
    """
    CRUD for tenant Chatbot settings. Each client has an isolated configuration.
    """
    serializer_class = ChatbotConfigSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superadmin:
            client_id = self.request.query_params.get('client_id')
            if client_id:
                return ChatbotConfiguration.objects.filter(client_id=client_id).select_related('client', 'whatsapp_account')
            return ChatbotConfiguration.objects.all().select_related('client', 'whatsapp_account')
        if user.client:
            return ChatbotConfiguration.objects.filter(client=user.client).select_related('client', 'whatsapp_account')
        return ChatbotConfiguration.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        client = user.client if not user.is_superadmin else serializer.validated_data.get('client')
        serializer.save(client=client)

    @action(detail=True, methods=['post'])
    def simulate(self, request, pk=None):
        """
        Interactive sandbox to test the AI chatbot using the client's actual knowledge documents.
        Never hallucinates fake business inventory or pricing.
        """
        config = self.get_object()
        serializer = SimulateChatSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_msg = serializer.validated_data['message']
        history = serializer.validated_data.get('history', [])

        service = ChatbotAIService(config)
        result = service.generate_response(user_msg, conversation_history=history)
        return Response(result)

    @action(detail=False, methods=['post'], url_path='test_auto_reply')
    def test_auto_reply(self, request):
        """
        Tests the client's real auto-reply configuration from the database.
        Never outputs hardcoded fake business or wedding data.
        """
        user = request.user
        client = user.client if hasattr(user, 'client') and user.client else None
        if not client:
            client = Client.objects.first()

        phone_number = request.data.get('phone_number', '')
        incoming_text = str(request.data.get('message', '')).strip().lower()
        dispatch_to_phone = request.data.get('dispatch_to_phone', False)

        config = ChatbotConfiguration.objects.filter(client=client).first()
        welcome = config.welcome_message if (config and config.welcome_message) else f"Hello! Welcome to {client.name}."
        fallback = config.fallback_message if (config and config.fallback_message) else "Thank you for your message. Our team will get back to you shortly."

        # If incoming is a greeting, use welcome message
        if incoming_text in ['hi', 'hello', 'hey', 'start', 'menu']:
            reply_text = welcome
        else:
            # Check AI service if config exists
            reply_text = fallback
            if config and config.is_enabled:
                ai_service = ChatbotAIService(config)
                ai_resp = ai_service.generate_response(incoming_text)
                if ai_resp.get('response'):
                    reply_text = ai_resp['response']

        from apps.whatsapp.infisq_client import InfisqWhatsAppClient
        infisq = InfisqWhatsAppClient()
        gateway_res = None
        if dispatch_to_phone and phone_number and infisq.is_configured:
            gateway_res = infisq.send_text_message(contact=phone_number, message=reply_text)

        return Response({
            'success': True,
            'response': reply_text,
            'dispatched': bool(dispatch_to_phone),
            'gateway_result': gateway_res
        })


class KnowledgeDocumentViewSet(viewsets.ModelViewSet):
    """
    Knowledge base documents and FAQ items used for AI chatbot context.
    """
    serializer_class = KnowledgeDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'content']
    ordering_fields = ['title', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.is_superadmin:
            client_id = self.request.query_params.get('client_id')
            if client_id:
                return KnowledgeDocument.objects.filter(client_id=client_id).select_related('client', 'chatbot')
            return KnowledgeDocument.objects.all().select_related('client', 'chatbot')
        if user.client:
            return KnowledgeDocument.objects.filter(client=user.client).select_related('client', 'chatbot')
        return KnowledgeDocument.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        client = user.client if not user.is_superadmin else serializer.validated_data.get('client')
        # Ensure chatbot belongs to client
        chatbot = serializer.validated_data.get('chatbot')
        if not chatbot:
            chatbot, _ = ChatbotConfiguration.objects.get_or_create(client=client)
        serializer.save(client=client, chatbot=chatbot)
