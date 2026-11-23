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
        Tests the SBI-style interactive auto-reply directly on user's phone or returns simulator payload.
        """
        user = request.user
        client = user.client if hasattr(user, 'client') and user.client else None
        if not client:
            client = Client.objects.first()

        phone_number = request.data.get('phone_number', '9363938143')
        incoming_text = str(request.data.get('message', 'Hi')).strip().lower()
        dispatch_to_phone = request.data.get('dispatch_to_phone', False)

        from apps.whatsapp.infisq_client import InfisqWhatsAppClient
        infisq = InfisqWhatsAppClient()

        is_greeting = any(incoming_text.startswith(g) or incoming_text == g for g in ['hi', 'hello', 'hey', 'start', 'menu', 'vanakkam'])
        is_wedding = any(w in incoming_text for w in ['wedding', 'marriage', 'reception', 'package'])
        is_prewedding = any(w in incoming_text for w in ['pre-wedding', 'couple', 'outdoor', 'shoot'])
        is_call_naveen = any(w in incoming_text for w in ['call', 'naveen', 'human', 'agent', 'support', 'number', 'phone'])

        reply_header = f"📸 {client.name} - Salem"
        reply_text = ""
        reply_buttons = []

        if is_greeting:
            reply_header = f"📸 {client.name} - Salem"
            reply_text = (
                f"Good Day! Welcome to *{client.name}* 📸✨\n\n"
                "Seamless photography booking is just a message away! "
                "We capture your precious wedding, reception, outdoor & birthday moments into cinematic memories.\n\n"
                "Explore our Services 👇"
            )
            reply_buttons = ['📸 Wedding Package', '🎬 Pre-Wedding Shoot', '📞 Call Naveen']
        elif is_wedding:
            reply_header = "📸 Wedding Special Package"
            reply_text = (
                "🎉 *Wedding & Reception Special Package*\n\n"
                "• 2 Days Full HD Candid Photography + Cinematography\n"
                "• Traditional & Drone Coverage\n"
                "• Free 4K Cinematic Teaser Reel\n"
                "• Premium Velvet Photo Album (40 Pages)\n\n"
                "✨ *Flat 30% OFF for 2026-2027 Bookings!*\n\n"
                "Choose an option below to proceed:"
            )
            reply_buttons = ['📅 Check Date', '🖼️ View Portfolio', '📞 Call Naveen']
        elif is_prewedding:
            reply_header = "✨ Outdoor & Couple Shoot"
            reply_text = (
                "✨ *Outdoor & Pre-Wedding Couple Shoot*\n\n"
                "• 50 Color-graded High-Resolution Photos\n"
                "• 1 Cinematic Instagram Reel for social media\n"
                "• Salem & Yercaud scenic locations\n\n"
                "All at just ₹4,999! Limited slots available.\n\n"
                "Choose an option below:"
            )
            reply_buttons = ['📸 Book Shoot', '📍 View Locations', '📞 Call Naveen']
        elif is_call_naveen:
            reply_header = "📞 Connect with Studio"
            reply_text = (
                "You can reach Naveen directly at *+91 9363938143* or reply here with your wedding date and venue details. "
                "Our studio team will contact you immediately!"
            )
            reply_buttons = ['📅 Check Date', '📸 Wedding Package']
        else:
            reply_header = f"📸 {client.name} - Salem"
            reply_text = (
                f"Thank you for messaging *{client.name}*! How can we assist you with your photography needs today?\n\n"
                "Explore our Services 👇"
            )
            reply_buttons = ['📸 Wedding Package', '🎬 Pre-Wedding Shoot', '📞 Call Naveen']

        gateway_res = None
        if dispatch_to_phone and phone_number:
            button_str = ','.join(reply_buttons[:3])
            gateway_res = infisq.send_button_message(
                contact=phone_number,
                message=reply_text,
                button=button_str,
                header_type='text',
                header_text=reply_header
            )

        return Response({
            'success': True,
            'header': reply_header,
            'response': reply_text,
            'buttons': reply_buttons,
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
