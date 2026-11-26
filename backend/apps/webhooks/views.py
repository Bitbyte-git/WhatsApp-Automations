import hmac
import hashlib
import json
import logging
import threading
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

_INACTIVITY_TIMERS = {}
_TIMER_LOCK = threading.Lock()


def _cancel_inactivity_timer(conv_id):
    with _TIMER_LOCK:
        old = _INACTIVITY_TIMERS.pop(conv_id, None)
        if old:
            old.cancel()


def _send_inactivity_notice(conv_id, client_id, account_id, contact_id, to_phone, phone_number_id, access_token, waba_id, trigger_ts):
    try:
        conv = Conversation.objects.filter(id=conv_id).first()
        if not conv:
            return
        # Skip if customer sent a newer message after this timer was scheduled
        if conv.last_message_at and conv.last_message_at.timestamp() > trigger_ts + 2:
            return

        if phone_number_id and str(phone_number_id).isdigit():
            mc = MetaCloudAPIClient(phone_number_id=phone_number_id, access_token=access_token, waba_id=waba_id)
        else:
            mc = MetaCloudAPIClient()

        if not mc.is_configured:
            return

        notice_text = (
            "It seems you've been inactive. Please clear this chat for safety.\n\n"
            'To continue, please type "Hi" to access the main menu.'
        )
        res = mc.send_text_message(to_phone_number=to_phone, text_content=notice_text)
        if res and res.get('success'):
            now = timezone.now()
            Message.objects.create(
                conversation_id=conv_id,
                client_id=client_id,
                whatsapp_account_id=account_id,
                contact_id=contact_id,
                wamid=res.get('wamid') or f"IDLE-{int(now.timestamp())}",
                direction='OUTBOUND',
                message_type='TEXT',
                content=notice_text,
                status='SENT',
                sent_at=now
            )
    except Exception as e:
        logger.warning(f"Inactivity timer notice failed for conv {conv_id}: {e}")
    finally:
        with _TIMER_LOCK:
            _INACTIVITY_TIMERS.pop(conv_id, None)


def _schedule_inactivity_timer(conv, client, account, contact, to_phone, meta_client, trigger_ts, delay_seconds=60.0):
    _cancel_inactivity_timer(conv.id)
    t = threading.Timer(
        delay_seconds,
        _send_inactivity_notice,
        args=(
            conv.id,
            client.id,
            account.id,
            contact.id,
            to_phone,
            meta_client.phone_number_id,
            meta_client.access_token,
            meta_client.waba_id,
            trigger_ts,
        ),
    )
    t.daemon = True
    with _TIMER_LOCK:
        _INACTIVITY_TIMERS[conv.id] = t
    t.start()

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
                    _cancel_inactivity_timer(conv.id)

                    WebhookEvent.objects.create(
                        event_id=event_id,
                        event_type='incoming_message',
                        whatsapp_account=account,
                        payload=msg_data,
                        status='PROCESSED',
                        processed_at=now
                    )

                    # ── Dynamic Database-Driven Interactive Menu & Chatbot Flow ──
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
                        chatbot_config = ChatbotConfiguration.objects.filter(client=client).first()
                        flow = (chatbot_config.interactive_flow or {}) if chatbot_config else {}
                        flow_enabled = bool(flow.get('enabled'))
                        menu_items = flow.get('menu_items') or []
                        action_buttons = flow.get('action_buttons') or []

                        if meta_client.is_configured:
                            greeting_name = sender_name or 'there'

                            # 1. Interactive Menu Flow (Configured by Admin/Client in Dashboard)
                            if flow_enabled and menu_items:
                                matched_item = next((m for m in menu_items if str(m.get('id')) == interactive_id), None)
                                matched_sub = None
                                if not matched_item:
                                    for m in menu_items:
                                        for sub in (m.get('sub_items') or []):
                                            if str(sub.get('id')) == interactive_id:
                                                matched_sub = (m, sub)
                                                break
                                        if matched_sub:
                                            break
                                matched_btn = next((b for b in action_buttons if str(b.get('id')) == interactive_id), None)

                                if cleaned_content in ['hi', 'hello', 'hey', 'start', 'menu', 'main menu'] or interactive_id == 'btn_main_menu':
                                    header_txt = str(flow.get('header_text') or client.name)[:60]
                                    welcome_txt = str(flow.get('welcome_text') or f"Hello {greeting_name}! Welcome to {client.name}.\n\nTap below to explore:")
                                    btn_label = str(flow.get('menu_button_label') or 'Explore Menu')[:20]
                                    footer_txt = str(flow.get('footer_text') or client.name)[:60]

                                    rows = []
                                    for idx, item in enumerate(menu_items[:10]):
                                        rows.append({
                                            'id': str(item.get('id') or f'item_{idx+1}'),
                                            'title': str(item.get('title') or f'Option {idx+1}')[:24],
                                            'description': str(item.get('description') or '')[:72]
                                        })

                                    bot_sent_text = welcome_txt
                                    bot_res = meta_client.send_interactive_list(
                                        to_phone_number=from_phone,
                                        header_text=header_txt,
                                        body_text=welcome_txt,
                                        button_label=btn_label,
                                        sections=[{'title': header_txt[:24], 'rows': rows}],
                                        footer_text=footer_txt
                                    )
                                elif matched_item:
                                    sub_items = [s for s in (matched_item.get('sub_items') or []) if s.get('title')]
                                    if sub_items:
                                        sub_rows = [
                                            {
                                                'id': str(s.get('id') or f'sub_{i+1}'),
                                                'title': str(s.get('title') or f'Item {i+1}')[:24],
                                                'description': str(s.get('description') or '')[:72]
                                            }
                                            for i, s in enumerate(sub_items[:9])
                                        ]
                                        sub_rows.append({'id': 'btn_main_menu', 'title': 'Main Menu', 'description': 'Go back to main categories'})
                                        sub_body = str(matched_item.get('reply_text') or f"Please select an option under {matched_item.get('title')}:")
                                        sub_btn_label = str(matched_item.get('sub_button_label') or 'Select Option')[:20]
                                        bot_sent_text = sub_body
                                        bot_res = meta_client.send_interactive_list(
                                            to_phone_number=from_phone,
                                            header_text=str(matched_item.get('title') or client.name)[:60],
                                            body_text=sub_body,
                                            button_label=sub_btn_label,
                                            sections=[{'title': str(matched_item.get('title') or 'Options')[:24], 'rows': sub_rows}],
                                            footer_text=str(flow.get('footer_text') or client.name)[:60]
                                        )
                                    else:
                                        bot_sent_text = str(matched_item.get('reply_text') or matched_item.get('title') or '')
                                        follow_btns = [
                                            {'id': str(b.get('id')), 'title': str(b.get('title'))[:20]}
                                            for b in action_buttons[:2] if b.get('title')
                                        ]
                                        follow_btns.append({'id': 'btn_main_menu', 'title': 'Main Menu'})
                                        bot_res = meta_client.send_interactive_buttons(
                                            to_phone_number=from_phone,
                                            header_text=str(matched_item.get('title') or client.name)[:60],
                                            body_text=bot_sent_text,
                                            buttons=follow_btns[:3],
                                            footer_text=str(flow.get('footer_text') or client.name)[:60]
                                        )
                                elif matched_sub:
                                    parent_item, sub_item = matched_sub
                                    bot_sent_text = str(sub_item.get('reply_text') or sub_item.get('title') or '')
                                    follow_btns = [
                                        {'id': str(b.get('id')), 'title': str(b.get('title'))[:20]}
                                        for b in action_buttons[:2] if b.get('title')
                                    ]
                                    follow_btns.append({'id': 'btn_main_menu', 'title': 'Main Menu'})
                                    bot_res = meta_client.send_interactive_buttons(
                                        to_phone_number=from_phone,
                                        header_text=str(sub_item.get('title') or parent_item.get('title') or client.name)[:60],
                                        body_text=bot_sent_text,
                                        buttons=follow_btns[:3],
                                        footer_text=str(flow.get('footer_text') or client.name)[:60]
                                    )
                                elif matched_btn:
                                    bot_sent_text = str(matched_btn.get('reply_text') or 'Thank you! Our team will contact you shortly.')
                                    bot_res = meta_client.send_interactive_buttons(
                                        to_phone_number=from_phone,
                                        body_text=bot_sent_text,
                                        buttons=[{'id': 'btn_main_menu', 'title': 'Main Menu'}],
                                        footer_text=str(flow.get('footer_text') or client.name)[:60]
                                    )

                            # 2. AI Chatbot fallback if not handled by Interactive Menu and AI is enabled
                            if not bot_res and chatbot_config and chatbot_config.is_enabled:
                                handover_keys = [k.strip().lower() for k in (chatbot_config.handover_keywords or '').split(',') if k.strip()]
                                if any(hk in cleaned_content for hk in handover_keys):
                                    bot_sent_text = chatbot_config.handover_message or "Connecting you to an agent. Please hold on."
                                elif cleaned_content in ['hi', 'hello', 'hey', 'start', 'menu'] and not flow_enabled:
                                    bot_sent_text = chatbot_config.welcome_message or f"Hello! Welcome to {client.name}."
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
                            if flow_enabled:
                                _schedule_inactivity_timer(
                                    conv=conv,
                                    client=client,
                                    account=account,
                                    contact=contact,
                                    to_phone=from_phone,
                                    meta_client=meta_client,
                                    trigger_ts=now.timestamp(),
                                    delay_seconds=60.0,
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
