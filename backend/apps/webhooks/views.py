import hmac
import hashlib
import json
import logging
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework import views, permissions, status, viewsets
from rest_framework.response import Response

from apps.whatsapp.models import WhatsAppAccount, WebhookEvent
from apps.inbox.models import Contact, Conversation, Message
from apps.chatbot.models import ChatbotConfiguration
from apps.chatbot.ai_service import ChatbotAIService
from apps.whatsapp.meta_client import MetaCloudAPIClient
from apps.whatsapp.infisq_client import InfisqWhatsAppClient
from apps.whatsapp.serializers import WebhookEventSerializer

logger = logging.getLogger(__name__)

class MetaWhatsAppWebhookView(views.APIView):
    """
    Official webhook receiver for Meta WhatsApp Cloud API.
    Handles verification challenge (GET) and incoming event payloads (POST).
    Implements HMAC-SHA256 signature verification and event deduplication.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        mode = request.query_params.get('hub.mode')
        token = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')

        verify_token = getattr(settings, 'META_VERIFY_TOKEN', 'bitbyte_whatsapp_webhook_token_secure')

        if mode == 'subscribe' and token == verify_token:
            logger.info("Meta webhook verification challenge succeeded.")
            return HttpResponse(challenge, content_type='text/plain', status=200)

        logger.warning(f"Meta webhook verification failed: token={token}")
        return HttpResponse('Verification failed', status=403)

    def post(self, request):
        signature = request.headers.get('X-Hub-Signature-256', '')
        body_bytes = request.body
        app_secret = getattr(settings, 'META_APP_SECRET', '')

        # 1. Signature Verification (when META_APP_SECRET is configured)
        if app_secret:
            expected_hash = hmac.new(app_secret.encode('utf-8'), body_bytes, hashlib.sha256).hexdigest()
            expected_sig = f"sha256={expected_hash}"
            if not hmac.compare_digest(signature, expected_sig):
                logger.error("Invalid Meta webhook HMAC signature.")
                return HttpResponse('Invalid signature', status=401)

        try:
            payload = json.loads(body_bytes.decode('utf-8'))
        except Exception as e:
            logger.error(f"Failed to parse webhook JSON: {e}")
            return HttpResponse('Bad JSON', status=400)

        # 2. Extract entries
        entries = payload.get('entry', [])
        for entry in entries:
            entry_id = entry.get('id', '')
            changes = entry.get('changes', [])
            for change in changes:
                field = change.get('field')
                value = change.get('value', {})
                metadata = value.get('metadata', {})
                phone_number_id = metadata.get('phone_number_id')

                # Identify WhatsApp Account
                account = None
                if phone_number_id:
                    account = WhatsAppAccount.objects.filter(phone_number_id=phone_number_id).select_related('client').first()

                # Process Status Updates (delivered, read, failed)
                statuses = value.get('statuses', [])
                for st in statuses:
                    wamid = st.get('id')
                    status_name = st.get('status', '').upper()
                    timestamp = st.get('timestamp')
                    event_id = f"status_{wamid}_{status_name}"

                    # Deduplication check
                    if WebhookEvent.objects.filter(event_id=event_id).exists():
                        continue

                    WebhookEvent.objects.create(
                        event_id=event_id,
                        event_type=f"message_status_{status_name.lower()}",
                        whatsapp_account=account,
                        payload=st,
                        status='PROCESSED',
                        processed_at=timezone.now()
                    )

                    # Update Message record
                    msg = Message.objects.filter(wamid=wamid).first()
                    if msg:
                        now = timezone.now()
                        if status_name == 'DELIVERED':
                            msg.status = 'DELIVERED'
                            msg.delivered_at = now
                        elif status_name == 'READ':
                            msg.status = 'READ'
                            msg.read_at = now
                        elif status_name == 'FAILED':
                            msg.status = 'FAILED'
                            errors = st.get('errors', [{}])
                            msg.error_code = str(errors[0].get('code', '')) if errors else ''
                            msg.error_message = errors[0].get('message', 'Delivery failed') if errors else ''
                        msg.save()

                # Process Inbound Messages
                messages = value.get('messages', [])
                contacts_info = value.get('contacts', [])
                for msg_data in messages:
                    msg_id = msg_data.get('id')
                    from_phone = msg_data.get('from', '')
                    msg_type = msg_data.get('type', 'text').upper()
                    event_id = f"msg_{msg_id}"

                    # Deduplication check
                    if WebhookEvent.objects.filter(event_id=event_id).exists():
                        continue

                    # Extract sender name from Meta contact profile
                    sender_name = ''
                    for c_info in contacts_info:
                        if c_info.get('wa_id') == from_phone:
                            sender_name = c_info.get('profile', {}).get('name', '')
                            break

                    # Resolve client from account or default
                    if not account:
                        account = WhatsAppAccount.objects.first()

                    if not account:
                        # Log unassigned webhook
                        WebhookEvent.objects.create(
                            event_id=event_id,
                            event_type='unassigned_message',
                            payload=msg_data,
                            status='FAILED',
                            error_message='No WhatsApp Account found for incoming message'
                        )
                        continue

                    client = account.client

                    # Create or update Contact
                    contact, _ = Contact.objects.get_or_create(
                        client=client,
                        phone_number=from_phone,
                        defaults={'name': sender_name}
                    )
                    if sender_name and not contact.name:
                        contact.name = sender_name
                        contact.save(update_fields=['name'])

                    # Create or get Conversation
                    conv, _ = Conversation.objects.get_or_create(
                        client=client,
                        whatsapp_account=account,
                        contact=contact
                    )

                    # Extract content based on type
                    content = ''
                    media_url = ''
                    if msg_type == 'TEXT':
                        content = msg_data.get('text', {}).get('body', '')
                    elif msg_type in ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO']:
                        media_obj = msg_data.get(msg_type.lower(), {})
                        media_url = media_obj.get('id', '') # Media ID to fetch
                        content = media_obj.get('caption', f"[{msg_type} Attachment]")
                    elif msg_type == 'INTERACTIVE':
                        interactive = msg_data.get('interactive', {})
                        content = interactive.get('button_reply', {}).get('title', '') or interactive.get('list_reply', {}).get('title', '')
                    else:
                        content = f"[{msg_type} message]"

                    now = timezone.now()
                    message = Message.objects.create(
                        conversation=conv,
                        client=client,
                        whatsapp_account=account,
                        contact=contact,
                        wamid=msg_id,
                        direction='INBOUND',
                        message_type=msg_type if msg_type in dict(Message.TYPE_CHOICES) else 'TEXT',
                        content=content,
                        media_url=media_url,
                        status='DELIVERED',
                        delivered_at=now,
                        raw_metadata=msg_data
                    )

                    conv.unread_count += 1
                    conv.last_message_at = now
                    conv.last_message_preview = content[:200]
                    conv.save(update_fields=['unread_count', 'last_message_at', 'last_message_preview'])

                    WebhookEvent.objects.create(
                        event_id=event_id,
                        event_type='incoming_message',
                        whatsapp_account=account,
                        payload=msg_data,
                        status='PROCESSED',
                        processed_at=now
                    )

                    # SBI-Style Interactive Service Auto-Reply Engine
                    cleaned_content = content.strip().lower()
                    infisq_client = InfisqWhatsAppClient()
                    meta_client = MetaCloudAPIClient(
                        phone_number_id=account.phone_number_id,
                        access_token=account.access_token,
                        waba_id=account.waba_id
                    )

                    is_greeting = any(cleaned_content.startswith(g) or cleaned_content == g for g in ['hi', 'hello', 'hey', 'start', 'menu', 'vanakkam'])
                    is_wedding = any(w in cleaned_content for w in ['wedding', 'marriage', 'reception', 'package'])
                    is_prewedding = any(w in cleaned_content for w in ['pre-wedding', 'couple', 'outdoor', 'shoot'])
                    is_call_naveen = any(w in cleaned_content for w in ['call', 'naveen', 'human', 'agent', 'support', 'number', 'phone'])

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
                        chatbot_config = ChatbotConfiguration.objects.filter(client=client, is_enabled=True).first()
                        if chatbot_config:
                            ai_service = ChatbotAIService(chatbot_config)
                            ai_resp = ai_service.generate_response(content)
                            reply_text = ai_resp.get('response', '')
                        if not reply_text:
                            reply_text = (
                                f"Thank you for messaging *{client.name}*! How can we assist you with your photography needs today?\n\n"
                                "Explore our Services 👇"
                            )
                            reply_buttons = ['📸 Wedding Package', '🎬 Pre-Wedding Shoot', '📞 Call Naveen']

                    if reply_text:
                        button_str = ','.join(reply_buttons[:3]) if reply_buttons else ''
                        if infisq_client.is_configured:
                            if button_str:
                                infisq_client.send_button_message(
                                    contact=from_phone,
                                    message=reply_text,
                                    button=button_str,
                                    header_type='text',
                                    header_text=reply_header
                                )
                            else:
                                infisq_client.send_text_message(
                                    contact=from_phone,
                                    message=f"*{reply_header}*\n\n{reply_text}"
                                )
                        elif meta_client.is_configured:
                            meta_client.send_text_message(to_phone_number=from_phone, text_content=reply_text)

                        Message.objects.create(
                            conversation=conv,
                            client=client,
                            whatsapp_account=account,
                            contact=contact,
                            wamid=f"BOT-{int(timezone.now().timestamp())}",
                            direction='OUTBOUND',
                            message_type='BUTTON' if reply_buttons else 'TEXT',
                            content=f"[{reply_header}]\n{reply_text}" + (f"\nButtons: {button_str}" if button_str else ""),
                            status='SENT',
                            sent_at=now
                        )

        return HttpResponse('EVENT_RECEIVED', status=200)


class WebhookLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Audit log of recent Meta webhook events for debugging.
    """
    serializer_class = WebhookEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superadmin:
            return WebhookEvent.objects.all().order_by('-received_at')[:50]
        if user.client:
            return WebhookEvent.objects.filter(whatsapp_account__client=user.client).order_by('-received_at')[:50]
        return WebhookEvent.objects.none()
