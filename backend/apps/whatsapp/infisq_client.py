import os
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class InfisqWhatsAppClient:
    """
    Infisq WhatsApp Gateway API client (wa.infisq.com).
    Handles direct message sending, templates, media, buttons, and validity checks.
    """
    def __init__(self, license_number=None, api_key=None, base_url=None):
        self.license_number = license_number or getattr(settings, 'INFISQ_WA_LICENSE_NUMBER', '43359374485')
        self.api_key = api_key or getattr(settings, 'INFISQ_WA_API_KEY', 'JD5zTemEWj0UX4IBV2oRanlqH')
        self.base_url = (base_url or getattr(settings, 'INFISQ_WA_BASE_URL', 'https://wa.infisq.com/api')).rstrip('/')

    @property
    def is_configured(self):
        return bool(self.license_number and self.api_key)

    def _normalize_phone(self, phone):
        """
        Formats phone number to standard E.164 without '+' or spaces, e.g. 919876543210
        """
        cleaned = ''.join(c for c in str(phone) if c.isdigit())
        if len(cleaned) == 10:
            cleaned = '91' + cleaned
        return cleaned

    def _parse_api_response(self, response):
        """
        Parses JSON response from wa.infisq.com and checks actual ApiResponse status.
        wa.infisq.com returns HTTP 200 even on errors with {"ApiResponse": "Failed", "ErrorMessage": "..."}.
        """
        raw_text = response.text.strip()
        status_ok = (response.status_code == 200)
        is_success = False
        error_msg = ''
        try:
            data = response.json()
            api_resp = str(data.get('ApiResponse', '')).strip().lower()
            is_success = status_ok and (api_resp == 'success')
            if not is_success:
                error_msg = data.get('ErrorMessage') or data.get('Message') or data.get('Description') or raw_text
        except Exception:
            is_success = status_ok and ('success' in raw_text.lower() and 'failed' not in raw_text.lower() and 'error' not in raw_text.lower())
            if not is_success:
                error_msg = raw_text

        return {
            'success': is_success,
            'status_code': response.status_code,
            'response': raw_text,
            'error': error_msg if not is_success else None
        }

    def check_account_validity(self):
        """
        Checks account validity on wa.infisq.com.
        GET /accountvalidity.php?LicenseNumber=...&APIKey=...
        """
        if not self.is_configured:
            return {'success': False, 'error': 'Missing Infisq LicenseNumber or APIKey.'}

        url = f"{self.base_url}/accountvalidity.php"
        params = {
            'LicenseNumber': self.license_number,
            'APIKey': self.api_key,
        }
        try:
            response = requests.get(url, params=params, timeout=15)
            return self._parse_api_response(response)
        except requests.exceptions.RequestException as e:
            logger.error(f"Infisq check account validity error: {e}")
            return {'success': False, 'error': str(e)}

    def check_conversation_validity(self, contact):
        """
        Checks conversation validity for a specific contact.
        GET /conversationvalidity.php?LicenseNumber=...&APIKey=...&Contact=...
        """
        if not self.is_configured:
            return {'success': False, 'error': 'Missing Infisq LicenseNumber or APIKey.'}

        url = f"{self.base_url}/conversationvalidity.php"
        params = {
            'LicenseNumber': self.license_number,
            'APIKey': self.api_key,
            'Contact': self._normalize_phone(contact),
        }
        try:
            response = requests.get(url, params=params, timeout=15)
            return self._parse_api_response(response)
        except requests.exceptions.RequestException as e:
            logger.error(f"Infisq check conversation validity error: {e}")
            return {'success': False, 'error': str(e)}

    def send_text_message(self, contact, message):
        """
        Sends standard text message via wa.infisq.com.
        GET /sendtextmessage.php?LicenseNumber=...&APIKey=...&Contact=...&Message=...
        """
        if not self.is_configured:
            return {'success': False, 'error': 'Infisq WhatsApp Gateway is not configured.'}

        url = f"{self.base_url}/sendtextmessage.php"
        params = {
            'LicenseNumber': self.license_number,
            'APIKey': self.api_key,
            'Contact': self._normalize_phone(contact),
            'Message': message,
        }
        try:
            response = requests.get(url, params=params, timeout=15)
            return self._parse_api_response(response)
        except requests.exceptions.RequestException as e:
            logger.error(f"Infisq send text message error: {e}")
            return {'success': False, 'error': str(e)}

    def send_template_message(self, contact, template, param='', file_url='', url_param='', head_url='', head_param='', name='', pdf_name=''):
        """
        Sends template message via wa.infisq.com.
        GET /sendtemplate.php
        """
        if not self.is_configured:
            return {'success': False, 'error': 'Infisq WhatsApp Gateway is not configured.'}

        url = f"{self.base_url}/sendtemplate.php"
        params = {
            'LicenseNumber': self.license_number,
            'APIKey': self.api_key,
            'Contact': self._normalize_phone(contact),
            'Template': template,
            'Param': param,
            'Fileurl': file_url,
            'URLParam': url_param,
            'HeadURL': head_url,
            'HeadParam': head_param,
            'Name': name,
            'PDFName': pdf_name,
        }
        try:
            response = requests.get(url, params=params, timeout=15)
            return self._parse_api_response(response)
        except requests.exceptions.RequestException as e:
            logger.error(f"Infisq send template error: {e}")
            return {'success': False, 'error': str(e)}

    def send_media_message(self, contact, media_type, file_url):
        """
        Sends media (image/audio/document/video) via wa.infisq.com.
        GET /sendmediamessage.php
        """
        if not self.is_configured:
            return {'success': False, 'error': 'Infisq WhatsApp Gateway is not configured.'}

        url = f"{self.base_url}/sendmediamessage.php"
        params = {
            'LicenseNumber': self.license_number,
            'APIKey': self.api_key,
            'Contact': self._normalize_phone(contact),
            'Type': media_type,
            'FileURL': file_url,
        }
        try:
            response = requests.get(url, params=params, timeout=15)
            return self._parse_api_response(response)
        except requests.exceptions.RequestException as e:
            logger.error(f"Infisq send media error: {e}")
            return {'success': False, 'error': str(e)}

    def send_button_message(self, contact, message, button, header_type='text', header_text='', header_url='', footer_text=''):
        """
        Sends interactive button message via wa.infisq.com.
        GET /sendmediamessage.php with Type=button
        """
        if not self.is_configured:
            return {'success': False, 'error': 'Infisq WhatsApp Gateway is not configured.'}

        url = f"{self.base_url}/sendmediamessage.php"
        params = {
            'LicenseNumber': self.license_number,
            'APIKey': self.api_key,
            'Contact': self._normalize_phone(contact),
            'Message': message,
            'Type': 'button',
            'HeaderType': header_type,
            'HeaderText': header_text,
            'HeaderURL': header_url,
            'FooterText': footer_text,
            'Button': button,
        }
        try:
            response = requests.get(url, params=params, timeout=15)
            return self._parse_api_response(response)
        except requests.exceptions.RequestException as e:
            logger.error(f"Infisq send button error: {e}")
            return {'success': False, 'error': str(e)}

    def send_list_message(self, contact, message, button, list_button_text='Menu', section_text='Options', header_type='text', header_text='', footer_text=''):
        """
        Sends interactive list message via wa.infisq.com.
        GET /sendmediamessage.php with Type=list
        """
        if not self.is_configured:
            return {'success': False, 'error': 'Infisq WhatsApp Gateway is not configured.'}

        url = f"{self.base_url}/sendmediamessage.php"
        params = {
            'LicenseNumber': self.license_number,
            'APIKey': self.api_key,
            'Contact': self._normalize_phone(contact),
            'Message': message,
            'Type': 'list',
            'HeaderType': header_type,
            'HeaderText': header_text,
            'FooterText': footer_text,
            'ListButtonText': list_button_text,
            'SectionText': section_text,
            'Button': button,
        }
        try:
            response = requests.get(url, params=params, timeout=15)
            return self._parse_api_response(response)
        except requests.exceptions.RequestException as e:
            logger.error(f"Infisq send list error: {e}")
            return {'success': False, 'error': str(e)}
