import hmac
import hashlib
import json
import logging
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import views, permissions, viewsets

from apps.whatsapp.models import WhatsAppAccount, WebhookEvent
from apps.inbox.models import Contact, Conversation, Message
from apps.chatbot.models import ChatbotConfiguration
from apps.chatbot.ai_service import ChatbotAIService
from apps.whatsapp.meta_client import MetaCloudAPIClient
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
                    interactive_id = ''
                    if msg_type == 'TEXT':
                        content = msg_data.get('text', {}).get('body', '')
                    elif msg_type in ['IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO']:
                        media_obj = msg_data.get(msg_type.lower(), {})
                        media_url = media_obj.get('id', '') # Media ID to fetch
                        content = media_obj.get('caption', f"[{msg_type} Attachment]")
                    elif msg_type == 'INTERACTIVE':
                        interactive = msg_data.get('interactive', {})
                        btn_reply = interactive.get('button_reply', {})
                        list_reply = interactive.get('list_reply', {})
                        interactive_id = btn_reply.get('id', '') or list_reply.get('id', '')
                        content = btn_reply.get('title', '') or list_reply.get('title', '')
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

                    # ── BitByte Interactive Service Bot Flow (FREE 24h Service Window) ──
                    if content:
                        cleaned_content = content.strip().lower()
                        if account.phone_number_id and str(account.phone_number_id).isdigit():
                            meta_client = MetaCloudAPIClient(
                                phone_number_id=account.phone_number_id,
                                access_token=account.access_token,
                                waba_id=account.waba_id
                            )
                        else:
                            meta_client = MetaCloudAPIClient()

                        bot_sent_text = ''
                        bot_res = None

                        if meta_client.is_configured:
                            greeting_name = sender_name or 'there'
                            if cleaned_content in ['hi', 'hello', 'hey', 'start', 'menu', 'main menu'] or interactive_id == 'btn_main_menu':
                                bot_sent_text = f"Welcome to {client.name}, {greeting_name}! Please explore our services:"
                                sections = [{
                                    'title': 'Our Services',
                                    'rows': [
                                        {'id': 'srv_webapp', 'title': 'Web App Development', 'description': 'Custom Websites, SaaS & Portals'},
                                        {'id': 'srv_mobile', 'title': 'Mobile App Development', 'description': 'Android & iOS Business Apps'},
                                        {'id': 'srv_ecommerce', 'title': 'E-Commerce Stores', 'description': 'Online Store + Payment Gateway'},
                                        {'id': 'srv_marketing', 'title': 'Digital Marketing', 'description': 'Meta Ads, Google Ads & SEO'},
                                        {'id': 'srv_whatsapp', 'title': 'WhatsApp Cloud API', 'description': 'Bulk Sender & Automation Bot'},
                                        {'id': 'srv_contact', 'title': 'Talk to Our Team', 'description': 'Direct Call & Free Consultation'},
                                    ]
                                }]
                                bot_res = meta_client.send_interactive_list(
                                    to_phone_number=from_phone,
                                    header_text=client.name,
                                    body_text=f"Hello {greeting_name}! Welcome to {client.name}.\n\nTap below to explore our services and get instant details:",
                                    button_label='Explore Services',
                                    sections=sections,
                                    footer_text='Powered by BitByte WhatsApp Engine'
                                )
                            elif interactive_id in ['srv_webapp', 'srv_mobile', 'srv_ecommerce', 'srv_marketing', 'srv_whatsapp']:
                                service_details = {
                                    'srv_webapp': '*Web App Development*\nWe build ultra-fast custom Websites, SaaS Dashboards & Portals tailored for your business.',
                                    'srv_mobile': '*Mobile App Development*\nNative & cross-platform Android & iOS apps with modern UI and smooth performance.',
                                    'srv_ecommerce': '*E-Commerce Solutions*\nComplete online shopping store with Cart, UPI/Razorpay checkout & Order tracking.',
                                    'srv_marketing': '*Digital Marketing*\nGrow leads & sales with targeted Meta Ads, Google Ads, SEO & Branding.',
                                    'srv_whatsapp': '*WhatsApp Cloud API*\nOfficial Meta WhatsApp Broadcast, Bulk Excel Sender & Automated Interactive Bot.',
                                }
                                bot_sent_text = service_details[interactive_id]
                                bot_res = meta_client.send_interactive_buttons(
                                    to_phone_number=from_phone,
                                    header_text=client.name,
                                    body_text=f"{bot_sent_text}\n\nHow would you like to proceed?",
                                    buttons=[
                                        {'id': 'btn_get_quote', 'title': 'Get Pricing'},
                                        {'id': 'btn_book_call', 'title': 'Book Free Call'},
                                        {'id': 'btn_main_menu', 'title': 'Main Menu'},
                                    ],
                                    footer_text='Select an option below'
                                )
                            elif interactive_id in ['btn_get_quote', 'btn_book_call', 'srv_contact']:
                                bot_sent_text = (
                                    f"Thank you {greeting_name}! Our team will reach out to you shortly.\n\n"
                                    f"Direct Call / WhatsApp: +91 93639 38143\n"
                                    f"Office: BitByte Technologies, Salem, TN"
                                )
                                bot_res = meta_client.send_interactive_buttons(
                                    to_phone_number=from_phone,
                                    body_text=bot_sent_text,
                                    buttons=[{'id': 'btn_main_menu', 'title': 'Main Menu'}],
                                    footer_text='BitByte Support'
                                )
                            else:
                                # Fallback to AI Chatbot if enabled
                                chatbot_config = ChatbotConfiguration.objects.filter(client=client, is_enabled=True).first()
                                if chatbot_config:
                                    handover_keys = [k.strip().lower() for k in (chatbot_config.handover_keywords or '').split(',') if k.strip()]
                                    if any(hk in cleaned_content for hk in handover_keys):
                                        bot_sent_text = chatbot_config.handover_message or "Connecting you to an agent. Please hold on."
                                    else:
                                        ai_service = ChatbotAIService(chatbot_config)
                                        ai_resp = ai_service.generate_response(content)
                                        bot_sent_text = ai_resp.get('response') or chatbot_config.fallback_message
                                    if bot_sent_text:
                                        bot_res = meta_client.send_text_message(to_phone_number=from_phone, text_content=bot_sent_text)

                        if bot_res and bot_res.get('success') and bot_sent_text:
                            Message.objects.create(
                                conversation=conv,
                                client=client,
                                whatsapp_account=account,
                                contact=contact,
                                wamid=bot_res.get('wamid') or f"BOT-{int(timezone.now().timestamp())}",
                                direction='OUTBOUND',
                                message_type='INTERACTIVE',
                                content=bot_sent_text,
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
