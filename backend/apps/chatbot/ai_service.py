import os
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class ChatbotAIService:
    """
    RAG & AI Chatbot service for BitByte WhatsApp SaaS.
    Strictly answers customer inquiries based on tenant's configured system prompt
    and uploaded knowledge documents.
    """
    def __init__(self, config):
        self.config = config
        self.client = config.client
        self.api_key = getattr(settings, 'OPENROUTER_API_KEY', '') or os.environ.get('OPENROUTER_API_KEY', '')
        self.model = config.model_name or getattr(settings, 'OPENROUTER_MODEL', 'openai/gpt-oss-20b')

    def check_handover(self, incoming_text):
        if not self.config.handover_enabled:
            return False

        keywords = [k.strip().lower() for k in self.config.handover_keywords.split(',') if k.strip()]
        lower_msg = incoming_text.lower()
        for kw in keywords:
            if kw in lower_msg:
                return True
        return False

    def generate_response(self, customer_message, conversation_history=None):
        """
        Executes AI completion with tenant knowledge context.
        """
        # 1. Check human handover trigger
        if self.check_handover(customer_message):
            return {
                'response': self.config.handover_message,
                'handover_triggered': True,
                'provider': 'rule-handover'
            }

        # 2. Retrieve active knowledge documents for this tenant
        docs = self.client.knowledge_documents.filter(is_active=True)
        knowledge_context = ""
        if docs.exists():
            knowledge_pieces = []
            for d in docs:
                knowledge_pieces.append(f"--- Document: {d.title} ---\n{d.content}")
            knowledge_context = "\n\n".join(knowledge_pieces)

        system_instruction = f"""{self.config.system_prompt}

IMPORTANT RULES:
1. You represent {self.client.name}.
2. Use ONLY the factual information provided in the company knowledge base below.
3. NEVER invent product prices, stock availability, or fake business guarantees.
4. If you cannot find the answer in the provided context, state politely: "{self.config.fallback_message}"

COMPANY KNOWLEDGE BASE:
{knowledge_context or 'No specific documents uploaded. Provide general polite assistance.'}
"""

        messages = [{'role': 'system', 'content': system_instruction}]

        # Add brief history if provided
        if conversation_history and isinstance(conversation_history, list):
            for h in conversation_history[-6:]:
                messages.append(h)

        messages.append({'role': 'user', 'content': customer_message})

        if not self.api_key:
            return {
                'response': self.config.fallback_message,
                'handover_triggered': False,
                'provider': 'fallback-no-api-key',
                'note': 'AI provider API key is not configured.'
            }

        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://bitbytetech.org',
                'X-Title': 'BitByte WhatsApp SaaS Chatbot',
            }
            payload = {
                'model': self.model,
                'messages': messages,
                'max_tokens': self.config.max_tokens,
                'temperature': float(self.config.temperature),
            }

            resp = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                json=payload,
                headers=headers,
                timeout=20
            )

            if resp.status_code == 200:
                data = resp.json()
                reply = data.get('choices', [{}])[0].get('message', {}).get('content', '')
                return {
                    'response': reply.strip() or self.config.fallback_message,
                    'handover_triggered': False,
                    'provider': 'openrouter',
                    'model': self.model
                }
            else:
                logger.error(f"OpenRouter API error {resp.status_code}: {resp.text}")
                return {
                    'response': self.config.fallback_message,
                    'handover_triggered': False,
                    'provider': 'error-fallback'
                }
        except Exception as e:
            logger.error(f"Chatbot execution error: {e}")
            return {
                'response': self.config.fallback_message,
                'handover_triggered': False,
                'provider': 'exception-fallback'
            }
