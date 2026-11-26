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
        import re
        safe_body = re.sub(r'[\r\n\t]+', ' | ', body_text or '')
        safe_body = re.sub(r' {2,}', ' ', safe_body).strip()[:1024]
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
        components = [{
            'type': 'body',
            'parameters': [{
                'type': 'text',
                'text': body_text[:1024]
            }]
        }]
        return self.send_template_message(
            to_phone_number=to_phone_number,
            template_name='bitbyte_utility_update',
            language_code='en',
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
