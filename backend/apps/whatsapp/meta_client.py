import os
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class MetaCloudAPIClient:
    """
    Official Meta WhatsApp Cloud API client.
    Interacts with Meta Graph API endpoints for messages, templates, and phone numbers.
    """
    def __init__(self, phone_number_id=None, access_token=None, waba_id=None):
        self.phone_number_id = phone_number_id or getattr(settings, 'META_PHONE_NUMBER_ID', '')
        self.access_token = access_token or getattr(settings, 'META_SYSTEM_USER_TOKEN', '')
        self.waba_id = waba_id or getattr(settings, 'META_WABA_ID', '')
        self.graph_version = getattr(settings, 'META_GRAPH_API_VERSION', 'v21.0')
        self.base_url = f"https://graph.facebook.com/{self.graph_version}"

    @property
    def is_configured(self):
        return bool(self.access_token and (self.phone_number_id or self.waba_id))

    def _get_headers(self):
        return {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json',
        }

    def send_text_message(self, to_phone_number, text_content):
        """
        Sends a standard text message to a WhatsApp user.
        """
        if not self.is_configured:
            return {
                'success': False,
                'error': 'WhatsApp integration is not configured. Missing Meta credentials or Phone Number ID.'
            }

        url = f"{self.base_url}/{self.phone_number_id}/messages"
        payload = {
            'messaging_product': 'whatsapp',
            'recipient_type': 'individual',
            'to': to_phone_number.replace('+', '').replace(' ', ''),
            'type': 'text',
            'text': {'body': text_content}
        }

        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code in [200, 201]:
                message_id = data.get('messages', [{}])[0].get('id')
                return {'success': True, 'wamid': message_id, 'data': data}
            else:
                error_msg = data.get('error', {}).get('message', 'Failed to send message via Meta Cloud API')
                error_code = data.get('error', {}).get('code', response.status_code)
                return {'success': False, 'error': error_msg, 'code': error_code, 'data': data}
        except requests.exceptions.RequestException as e:
            logger.error(f"Meta API send text error: {e}")
            return {'success': False, 'error': str(e)}

    @staticmethod
    def _sanitize_template_param(text, max_len=1024):
        """Meta template text parameters forbid newlines, tabs, and 4+ consecutive spaces."""
        import re
        safe = re.sub(r'[\r\n\t]+', ' | ', text or '')
        safe = re.sub(r' {2,}', ' ', safe).strip()
        return safe[:max_len] or '-'

    def send_marketing_offer_template(self, to_phone_number, body_text, image_url=None):
        """
        Sends the official pre-approved bitbyte_offer marketing template with dynamic image and dynamic body text.
        Works for cold leads who never sent 'Hi'!
        """
        components = []
        if image_url:
            # Meta template image headers require JPEG/PNG; convert Cloudinary WebP delivery URLs on the fly
            meta_img_url = image_url.replace('f_webp', 'f_jpg')
            if meta_img_url.lower().endswith('.webp'):
                meta_img_url = meta_img_url[:-5] + '.jpg'
            components.append({
                'type': 'header',
                'parameters': [{
                    'type': 'image',
                    'image': {'link': meta_img_url}
                }]
            })
        safe_body = self._sanitize_template_param(body_text)
        components.append({
            'type': 'body',
            'parameters': [{
                'type': 'text',
                'text': safe_body
            }]
        })
        return self.send_template_message(
            to_phone_number=to_phone_number,
            template_name='bitbyte_offer',
            language_code='en',
            components=components
        )

    def send_utility_update_template(self, to_phone_number, body_text, image_url=None):
        """
        Sends the bitbyte_utility_update template (Utility category, ~0.14 INR/msg).
        Created as text-only Utility template for instant Meta approval.
        """
        safe_body = self._sanitize_template_param(body_text)
        components = [{
            'type': 'body',
            'parameters': [{
                'type': 'text',
                'text': safe_body
            }]
        }]
        return self.send_template_message(
            to_phone_number=to_phone_number,
            template_name='bitbyte_utility_update',
            language_code='en',
            components=components
        )

    def send_authentication_otp_template(self, to_phone_number, otp_code, template_name='bitbyte_auth_otp', language_code='en'):
        """
        Sends an approved Meta AUTHENTICATION (OTP) template with Copy Code button.
        """
        code_str = str(otp_code).strip()[:15]
        components = [
            {
                'type': 'body',
                'parameters': [{'type': 'text', 'text': code_str}],
            },
            {
                'type': 'button',
                'sub_type': 'url',
                'index': '0',
                'parameters': [{'type': 'text', 'text': code_str}],
            },
        ]
        return self.send_template_message(
            to_phone_number=to_phone_number,
            template_name=template_name,
            language_code=language_code or 'en',
            components=components
        )

    def send_template_message(self, to_phone_number, template_name, language_code='en_US', components=None):
        """
        Sends a pre-approved Meta WhatsApp template message.
        """
        if not self.is_configured:
            return {
                'success': False,
                'error': 'WhatsApp integration is not configured. Missing Meta credentials or Phone Number ID.'
            }

        url = f"{self.base_url}/{self.phone_number_id}/messages"
        payload = {
            'messaging_product': 'whatsapp',
            'recipient_type': 'individual',
            'to': to_phone_number.replace('+', '').replace(' ', ''),
            'type': 'template',
            'template': {
                'name': template_name,
                'language': {'code': language_code},
                'components': components or []
            }
        }

        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code in [200, 201]:
                message_id = data.get('messages', [{}])[0].get('id')
                return {'success': True, 'wamid': message_id, 'data': data}
            else:
                error_msg = data.get('error', {}).get('message', 'Failed to send template message')
                error_code = data.get('error', {}).get('code', response.status_code)
                return {'success': False, 'error': error_msg, 'code': error_code, 'data': data}
        except requests.exceptions.RequestException as e:
            logger.error(f"Meta API send template error: {e}")
            return {'success': False, 'error': str(e)}

    def send_image_message(self, to_phone_number, image_url, caption=''):
        """
        Sends an image message via WhatsApp Cloud API using a public Cloudinary/CDN URL.
        image_url must be a publicly accessible HTTPS URL (WebP/JPEG/PNG all supported).
        """
        if not self.is_configured:
            return {
                'success': False,
                'error': 'WhatsApp integration is not configured. Missing Meta credentials or Phone Number ID.'
            }

        url = f"{self.base_url}/{self.phone_number_id}/messages"
        payload = {
            'messaging_product': 'whatsapp',
            'recipient_type': 'individual',
            'to': to_phone_number.replace('+', '').replace(' ', ''),
            'type': 'image',
            'image': {
                'link': image_url,
                'caption': caption
            }
        }

        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code in [200, 201]:
                message_id = data.get('messages', [{}])[0].get('id')
                return {'success': True, 'wamid': message_id, 'data': data}
            else:
                error_msg = data.get('error', {}).get('message', 'Failed to send image message')
                error_code = data.get('error', {}).get('code', response.status_code)
                return {'success': False, 'error': error_msg, 'code': error_code, 'data': data}
        except requests.exceptions.RequestException as e:
            logger.error(f"Meta API send image error: {e}")
            return {'success': False, 'error': str(e)}

    def send_interactive_buttons(self, to_phone_number, body_text, buttons, header_text=None, footer_text=None):
        """
        Sends up to 3 clickable Quick Reply buttons inside a 24h Service window (FREE).
        buttons: list of dicts [{'id': 'btn_1', 'title': 'Label'}] or list of strings.
        """
        if not self.is_configured:
            return {'success': False, 'error': 'WhatsApp integration is not configured.'}

        action_buttons = []
        for idx, b in enumerate((buttons or [])[:3]):
            if isinstance(b, dict):
                btn_id = str(b.get('id') or f'btn_{idx+1}')[:256]
                btn_title = str(b.get('title') or b.get('label') or f'Option {idx+1}')[:20]
            else:
                btn_id = f'btn_{idx+1}'
                btn_title = str(b)[:20]
            action_buttons.append({
                'type': 'reply',
                'reply': {'id': btn_id, 'title': btn_title}
            })

        interactive_obj = {
            'type': 'button',
            'body': {'text': (body_text or '')[:1024]},
            'action': {'buttons': action_buttons}
        }
        if header_text:
            interactive_obj['header'] = {'type': 'text', 'text': str(header_text)[:60]}
        if footer_text:
            interactive_obj['footer'] = {'text': str(footer_text)[:60]}

        url = f"{self.base_url}/{self.phone_number_id}/messages"
        payload = {
            'messaging_product': 'whatsapp',
            'recipient_type': 'individual',
            'to': to_phone_number.replace('+', '').replace(' ', ''),
            'type': 'interactive',
            'interactive': interactive_obj
        }
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code in [200, 201]:
                return {'success': True, 'wamid': data.get('messages', [{}])[0].get('id'), 'data': data}
            return {'success': False, 'error': data.get('error', {}).get('message', 'Interactive send failed'), 'data': data}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def send_interactive_list(self, to_phone_number, body_text, button_label, sections, header_text=None, footer_text=None):
        """
        Sends an SBI-style expandable Interactive List Menu inside a 24h Service window (FREE).
        """
        if not self.is_configured:
            return {'success': False, 'error': 'WhatsApp integration is not configured.'}

        interactive_obj = {
            'type': 'list',
            'body': {'text': (body_text or '')[:1024]},
            'action': {
                'button': str(button_label or 'Explore Services')[:20],
                'sections': sections
            }
        }
        if header_text:
            interactive_obj['header'] = {'type': 'text', 'text': str(header_text)[:60]}
        if footer_text:
            interactive_obj['footer'] = {'text': str(footer_text)[:60]}

        url = f"{self.base_url}/{self.phone_number_id}/messages"
        payload = {
            'messaging_product': 'whatsapp',
            'recipient_type': 'individual',
            'to': to_phone_number.replace('+', '').replace(' ', ''),
            'type': 'interactive',
            'interactive': interactive_obj
        }
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code in [200, 201]:
                return {'success': True, 'wamid': data.get('messages', [{}])[0].get('id'), 'data': data}
            return {'success': False, 'error': data.get('error', {}).get('message', 'Interactive list failed'), 'data': data}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def fetch_templates(self):
        """
        Retrieves all templates registered under the WABA.
        """
        if not self.waba_id or not self.access_token:
            return {'success': False, 'error': 'WhatsApp integration is not configured. Missing WABA ID or Access Token.'}

        url = f"{self.base_url}/{self.waba_id}/message_templates"
        try:
            response = requests.get(url, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code == 200:
                return {'success': True, 'templates': data.get('data', [])}
            else:
                error_msg = data.get('error', {}).get('message', 'Failed to fetch templates from Meta')
                return {'success': False, 'error': error_msg, 'data': data}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def create_template(self, name, category, language, body_text, header_text='', footer_text='', buttons=None):
        """
        Submits a new WhatsApp message template directly to Meta Graph API for review & approval.
        """
        if not self.waba_id or not self.access_token:
            return {'success': False, 'error': 'WhatsApp integration is not configured. Missing WABA ID or Access Token.'}

        import re
        components = []

        if category.upper() == 'AUTHENTICATION':
            components = [
                {'type': 'BODY', 'add_security_recommendation': True},
                {'type': 'FOOTER', 'code_expiration_minutes': 10},
                {
                    'type': 'BUTTONS',
                    'buttons': [{
                        'type': 'OTP',
                        'otp_type': 'COPY_CODE',
                        'text': 'Copy Code',
                    }],
                },
            ]
        else:
            if header_text and header_text.strip():
                # Meta forbids emojis, asterisks, newlines, and markdown formatting in text headers
                clean_header = re.sub(r'[\r\n\t*~_`]+', ' ', header_text)
                # Strip non-ASCII/emojis from header to guarantee 100% Meta compliance
                clean_header = re.sub(r'[^\x00-\x7F]+', '', clean_header).strip()[:60]
                if clean_header:
                    header_comp = {
                        'type': 'HEADER',
                        'format': 'TEXT',
                        'text': clean_header,
                    }
                    if re.search(r'\{\{\d+\}\}', clean_header):
                        header_comp['example'] = {'header_text': ['Sample Header']}
                    components.append(header_comp)

            body_comp = {
                'type': 'BODY',
                'text': body_text.strip()[:1024],
            }
            body_vars = sorted(set(re.findall(r'\{\{(\d+)\}\}', body_text or '')), key=lambda x: int(x))
            if body_vars:
                body_comp['example'] = {
                    'body_text': [[f'Sample_{v}' for v in body_vars]]
                }
            components.append(body_comp)

            if footer_text and footer_text.strip():
                components.append({
                    'type': 'FOOTER',
                    'text': footer_text.strip()[:60],
                })

            if buttons:
                meta_buttons = []
                for btn in buttons[:3]:
                    btn_text = (btn.get('text') if isinstance(btn, dict) else str(btn)).strip()
                    # Clean button text (no emojis, max 25 chars)
                    clean_btn = re.sub(r'[^\x00-\x7F]+', '', btn_text).strip()[:25]
                    if clean_btn:
                        meta_buttons.append({
                            'type': 'QUICK_REPLY',
                            'text': clean_btn,
                        })
                if meta_buttons:
                    components.append({
                        'type': 'BUTTONS',
                        'buttons': meta_buttons,
                    })

        # Sanitize template name: lowercase, letters/numbers/underscores only
        safe_name = re.sub(r'[^a-z0-9_]', '_', name.strip().lower())
        safe_name = re.sub(r'_+', '_', safe_name).strip('_')

        url = f"{self.base_url}/{self.waba_id}/message_templates"
        payload = {
            'name': safe_name,
            'category': category.upper(),
            'language': language.strip(),
            'components': components,
        }
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code in [200, 201]:
                return {
                    'success': True,
                    'meta_template_id': str(data.get('id', '')),
                    'status': str(data.get('status', 'PENDING')).upper(),
                    'category': str(data.get('category', category)).upper(),
                    'data': data,
                }
            err_obj = data.get('error', {})
            error_msg = err_obj.get('error_user_msg') or err_obj.get('message') or 'Failed to submit template to Meta'
            return {'success': False, 'error': error_msg, 'data': data}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def find_phone_number_in_waba(self, phone_number):
        """
        Queries Meta WABA phone numbers list and returns the phone_number_id matching the given phone.
        """
        if not self.waba_id or not self.access_token:
            return None
        url = f"{self.base_url}/{self.waba_id}/phone_numbers"
        try:
            res = requests.get(url, headers=self._get_headers(), timeout=15)
            if res.status_code == 200:
                clean_target = phone_number.replace('+', '').replace(' ', '').replace('-', '')
                for item in res.json().get('data', []):
                    item_phone = item.get('display_phone_number', '').replace('+', '').replace(' ', '').replace('-', '')
                    if clean_target in item_phone or item_phone in clean_target:
                        return str(item.get('id'))
        except Exception as e:
            logger.error(f"Error fetching WABA phone numbers: {e}")
        return None

    def add_phone_number_to_waba(self, phone_number, verified_name):
        """
        Attaches a client's new phone number to the Meta WhatsApp Business Account (WABA).
        Returns the newly created Meta phone_number_id.
        """
        if not self.waba_id or not self.access_token:
            return {'success': False, 'error': 'Missing Meta WABA ID or System User Access Token.'}

        # First check if the number is already attached to this WABA
        existing_id = self.find_phone_number_in_waba(phone_number)
        if existing_id:
            return {'success': True, 'phone_number_id': existing_id, 'already_exists': True}

        clean = phone_number.replace('+', '').replace(' ', '').replace('-', '')
        cc = '91'
        national_number = clean
        if clean.startswith('91') and len(clean) > 10:
            cc = '91'
            national_number = clean[2:]
        elif len(clean) == 10:
            cc = '91'
            national_number = clean

        url = f"{self.base_url}/{self.waba_id}/phone_numbers"
        payload = {
            'cc': cc,
            'phone_number': national_number,
            'verified_name': verified_name or 'Business Partner'
        }

        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code in [200, 201] and data.get('id'):
                return {'success': True, 'phone_number_id': str(data.get('id')), 'data': data}
            
            err_obj = data.get('error', {})
            error_code = err_obj.get('code')
            error_subcode = err_obj.get('error_subcode')
            err_msg_lower = str(err_obj).lower()

            if (
                error_code == 133010
                or error_subcode == 133010
                or 'already registered on a mobile' in err_msg_lower
            ):
                return {
                    'success': False,
                    'already_registered_on_mobile': True,
                    'error': 'This phone number is currently active on a mobile WhatsApp application. Please delete the account from your mobile WhatsApp app first, or use a fresh number.',
                    'code': 133010,
                    'data': data
                }

            # If Meta says ownership already verified or already exists on WABA, lookup its id
            if 'verified ownership' in err_msg_lower or 'already verified' in err_msg_lower or 'already registered' in err_msg_lower:
                found_id = self.find_phone_number_in_waba(phone_number)
                if found_id:
                    return {'success': True, 'phone_number_id': found_id, 'already_exists': True}

            error_msg = err_obj.get('error_user_msg') or err_obj.get('message') or 'Failed to add phone number to Meta WABA.'
            return {'success': False, 'error': error_msg, 'code': error_code, 'data': data}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def request_phone_code(self, code_method='SMS', language='en_US'):
        """
        Requests Meta to send a 6-digit SMS OTP to verify ownership of the phone number.
        """
        if not self.phone_number_id or not self.access_token:
            return {'success': False, 'error': 'Missing Phone Number ID or Meta System User Token.'}

        url = f"{self.base_url}/{self.phone_number_id}/request_code"
        payload = {
            'code_method': code_method.upper(),
            'language': language
        }
        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code in [200, 201] and data.get('success'):
                return {'success': True, 'data': data}
            err_obj = data.get('error', {})
            error_code = err_obj.get('code')
            error_subcode = err_obj.get('error_subcode')
            err_msg_lower = str(err_obj).lower()

            if (
                error_code == 133010
                or error_subcode == 133010
                or 'already registered' in err_msg_lower
                or 'already verified' in err_msg_lower
                or 'verified ownership' in err_msg_lower
                or 'already active' in err_msg_lower
                or 'already associated' in err_msg_lower
            ):
                return {
                    'success': False,
                    'already_registered_on_mobile': True,
                    'error': 'Sorry! This phone number is already active on WhatsApp. Please provide a new phone number that is not on WhatsApp, or delete your current mobile WhatsApp account to continue.',
                    'code': 133010,
                    'data': data
                }
            error_msg = err_obj.get('error_user_msg') or err_obj.get('message') or 'Failed to request OTP from Meta'
            return {'success': False, 'error': error_msg, 'code': error_code, 'data': data}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def verify_phone_code(self, code):
        """
        Submits the 6-digit SMS OTP to Meta's official /verify_code endpoint.
        Changes phone number status from UNVERIFIED to VERIFIED.
        """
        if not self.phone_number_id or not self.access_token:
            return {'success': False, 'error': 'Missing Phone Number ID or Meta System User Token.'}

        url = f"{self.base_url}/{self.phone_number_id}/verify_code"
        payload = {'code': str(code).strip()}

        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code in [200, 201] and data.get('success'):
                return {'success': True, 'data': data}
            err_obj = data.get('error', {})
            error_msg = err_obj.get('error_user_msg') or err_obj.get('message') or 'Invalid OTP verification code.'
            return {'success': False, 'error': error_msg, 'code': err_obj.get('code'), 'data': data}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def register_phone_number(self, pin='123456', code=None):
        """
        Registers phone number with Meta Cloud API.
        If code is provided, verifies code first via /verify_code, then registers with PIN.
        """
        if not self.phone_number_id or not self.access_token:
            return {'success': False, 'error': 'Missing Phone Number ID or Meta System User Token.'}

        if code:
            verify_res = self.verify_phone_code(code)
            if not verify_res.get('success'):
                err_text = verify_res.get('error', '').lower()
                if 'already verified' not in err_text:
                    return verify_res

        url = f"{self.base_url}/{self.phone_number_id}/register"
        payload = {
            'messaging_product': 'whatsapp',
            'pin': str(pin or '123456')
        }

        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code in [200, 201] and data.get('success'):
                return {'success': True, 'data': data}
            err_obj = data.get('error', {})
            error_msg = err_obj.get('error_user_msg') or err_obj.get('message') or 'Failed to register phone number with Meta'
            return {'success': False, 'error': error_msg, 'code': err_obj.get('code'), 'data': data}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def check_phone_number_status(self):
        """
        Inspects live phone number registration status, quality rating, and verified name from Meta.
        """
        if not self.phone_number_id or not self.access_token:
            return {'success': False, 'error': 'WhatsApp integration is not configured. Missing Phone Number ID or Access Token.'}

        url = f"{self.base_url}/{self.phone_number_id}"
        try:
            response = requests.get(
                url,
                params={'fields': 'verified_name,code_verification_status,display_phone_number,quality_rating'},
                headers=self._get_headers(),
                timeout=15
            )
            data = response.json()
            if response.status_code == 200:
                return {'success': True, 'details': data}
            else:
                error_msg = data.get('error', {}).get('message', 'Failed to fetch phone status from Meta')
                return {'success': False, 'error': error_msg, 'data': data}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def fetch_pricing_analytics(self, days=30):
        """
        Fetches official Meta WhatsApp Business Account pricing_analytics (real volume & cost by category).
        """
        if not self.waba_id or not self.access_token:
            return {'success': False, 'error': 'Missing WABA ID or Access Token.'}

        import time
        now_ts = int(time.time())
        start_ts = now_ts - (max(1, int(days)) * 86400)
        url = f"{self.base_url}/{self.waba_id}"
        params = {
            'fields': f'id,name,currency,pricing_analytics.start({start_ts}).end({now_ts}).granularity(DAILY).dimensions(PRICING_CATEGORY,PRICING_TYPE)'
        }
        try:
            response = requests.get(url, params=params, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code == 200:
                return {'success': True, 'data': data}
            err_msg = data.get('error', {}).get('message', 'Failed to fetch Meta pricing analytics')
            return {'success': False, 'error': err_msg, 'data': data}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def get_business_profile(self):
        """
        Fetches the official WhatsApp Business Profile registered on Meta for this phone number.
        Returns: about, address, description, email, profile_picture_url, websites, vertical.
        """
        if not self.phone_number_id or not self.access_token:
            return {'success': False, 'error': 'Missing Phone Number ID or Meta Access Token.'}

        url = f"{self.base_url}/{self.phone_number_id}/whatsapp_business_profile"
        params = {
            'fields': 'about,address,description,email,profile_picture_url,websites,vertical'
        }
        try:
            response = requests.get(url, params=params, headers=self._get_headers(), timeout=15)
            data = response.json()
            if response.status_code == 200:
                profile_data = (data.get('data') or [{}])[0] if isinstance(data.get('data'), list) else data
                return {'success': True, 'profile': profile_data}
            err_msg = data.get('error', {}).get('message', 'Failed to fetch WhatsApp Business Profile from Meta')
            return {'success': False, 'error': err_msg, 'data': data}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def update_business_profile(self, about=None, address=None, description=None, email=None, vertical=None, websites=None, profile_picture_handle=None):
        """
        Updates the WhatsApp Business Profile on Meta servers.
        Directly affects what customers see when inspecting the business contact info card in WhatsApp.
        """
        if not self.phone_number_id or not self.access_token:
            return {'success': False, 'error': 'Missing Phone Number ID or Meta Access Token.'}

        url = f"{self.base_url}/{self.phone_number_id}/whatsapp_business_profile"
        payload = {
            'messaging_product': 'whatsapp'
        }
        if about is not None:
            payload['about'] = str(about).strip()[:139]
        if address is not None:
            payload['address'] = str(address).strip()[:256]
        if description is not None:
            payload['description'] = str(description).strip()[:512]
        if email is not None:
            payload['email'] = str(email).strip()[:128]
        if vertical is not None and str(vertical).strip():
            payload['vertical'] = str(vertical).strip()
        if websites is not None:
            clean_sites = []
            if isinstance(websites, list):
                clean_sites = [str(w).strip() for w in websites if str(w).strip()][:2]
            elif isinstance(websites, str) and websites.strip():
                clean_sites = [w.strip() for w in websites.split(',') if w.strip()][:2]
            if clean_sites:
                payload['websites'] = clean_sites
        if profile_picture_handle:
            payload['profile_picture_handle'] = str(profile_picture_handle).strip()

        try:
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=20)
            data = response.json()
            if response.status_code in [200, 201] and (data.get('success') is True or 'data' in data):
                return {'success': True, 'data': data}
            err_msg = data.get('error', {}).get('message', 'Meta rejected Business Profile update')
            return {'success': False, 'error': err_msg, 'data': data}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}

    def upload_profile_picture_handle(self, file_bytes, mime_type='image/jpeg', app_id=None):
        """
        Uploads image binary to Meta Graph API Resumable Upload to generate a profile_picture_handle.
        """
        if not self.access_token:
            return {'success': False, 'error': 'Missing Meta Access Token.'}

        target_app = app_id or 'app'
        session_url = f"{self.base_url}/{target_app}/uploads"
        params = {
            'file_length': len(file_bytes),
            'file_type': mime_type
        }
        try:
            init_res = requests.post(session_url, params=params, headers=self._get_headers(), timeout=15)
            init_data = init_res.json()
            session_id = init_data.get('id')
            if not session_id:
                return {'success': False, 'error': init_data.get('error', {}).get('message', 'Failed to create upload session')}

            upload_url = f"{self.base_url}/{session_id}"
            headers = {
                'Authorization': f'OAuth {self.access_token}',
                'file_offset': '0'
            }
            upload_res = requests.post(upload_url, data=file_bytes, headers=headers, timeout=30)
            upload_data = upload_res.json()
            handle = upload_data.get('h')
            if handle:
                return {'success': True, 'handle': handle}
            return {'success': False, 'error': upload_data.get('error', {}).get('message', 'Failed to receive photo handle from Meta')}
        except requests.exceptions.RequestException as e:
            return {'success': False, 'error': str(e)}
