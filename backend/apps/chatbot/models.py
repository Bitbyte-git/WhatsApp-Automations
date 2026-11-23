from django.db import models
from apps.core.models import TimeStampedModel

class ChatbotConfiguration(TimeStampedModel):
    """
    AI Chatbot configuration per client tenant. Allows custom LLM provider,
    prompts, instructions, and human agent handover.
    """
    PROVIDER_CHOICES = [
        ('OPENROUTER', 'OpenRouter (Multi-model)'),
        ('OPENAI', 'OpenAI Direct'),
    ]

    client = models.OneToOneField(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='chatbot_config',
        db_index=True
    )
    whatsapp_account = models.ForeignKey(
        'whatsapp.WhatsAppAccount',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chatbot_configs'
    )
    is_enabled = models.BooleanField(default=False, db_index=True)
    provider = models.CharField(max_length=30, choices=PROVIDER_CHOICES, default='OPENROUTER')
    model_name = models.CharField(max_length=100, default='openai/gpt-oss-20b')
    system_prompt = models.TextField(
        default="You are an official AI business assistant for BitByte Technologies. Answer customer questions politely, accurately, and professionally based strictly on company knowledge."
    )
    welcome_message = models.TextField(
        default="Hello! Welcome to BitByte WhatsApp Customer Care. How can we help you today?"
    )
    fallback_message = models.TextField(
        default="Thank you for your message. I am currently unable to answer that question. Our team will get back to you shortly."
    )
    handover_enabled = models.BooleanField(default=True)
    handover_keywords = models.CharField(
        max_length=255,
        default="human, agent, representative, operator, support",
        help_text="Comma-separated trigger keywords to initiate human agent handover"
    )
    handover_message = models.TextField(
        default="Connecting you to our customer support executive. Please wait a moment."
    )
    max_tokens = models.PositiveIntegerField(default=500)
    temperature = models.DecimalField(max_digits=3, decimal_places=2, default=0.7)

    def __str__(self):
        return f"Chatbot for {self.client.name} ({'Enabled' if self.is_enabled else 'Disabled'})"


class KnowledgeDocument(TimeStampedModel):
    """
    Knowledge base document or FAQ item for tenant chatbot context.
    Strictly isolated per client.
    """
    TYPE_CHOICES = [
        ('TEXT', 'Custom Text / Article'),
        ('FAQ', 'Q&A / FAQ Pair'),
        ('DOCUMENT', 'Policy / Product Spec'),
    ]

    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='knowledge_documents',
        db_index=True
    )
    chatbot = models.ForeignKey(
        ChatbotConfiguration,
        on_delete=models.CASCADE,
        related_name='knowledge_documents'
    )
    title = models.CharField(max_length=255)
    content_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='TEXT')
    content = models.TextField(help_text="Actual knowledge text or questions and answers")
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'is_active']),
        ]

    def __str__(self):
        return f"{self.title} ({self.client.name})"
