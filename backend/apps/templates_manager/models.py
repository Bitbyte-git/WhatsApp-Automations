from django.db import models
from apps.core.models import TimeStampedModel

class MessageTemplate(TimeStampedModel):
    """
    WhatsApp Cloud API message template with header, body, footer, buttons,
    and official Meta approval status.
    """
    CATEGORY_CHOICES = [
        ('MARKETING', 'Marketing'),
        ('UTILITY', 'Utility'),
        ('AUTHENTICATION', 'Authentication'),
    ]

    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PENDING', 'Pending Meta Review'),
        ('APPROVED', 'Approved by Meta'),
        ('REJECTED', 'Rejected by Meta'),
        ('PAUSED', 'Paused'),
        ('DISABLED', 'Disabled'),
    ]

    HEADER_CHOICES = [
        ('NONE', 'None'),
        ('TEXT', 'Text'),
        ('IMAGE', 'Image'),
        ('VIDEO', 'Video'),
        ('DOCUMENT', 'Document'),
    ]

    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='templates',
        db_index=True
    )
    whatsapp_account = models.ForeignKey(
        'whatsapp.WhatsAppAccount',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='templates'
    )
    name = models.CharField(max_length=255, db_index=True, help_text="Template name in lowercase letters and underscores only")
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, db_index=True)
    language = models.CharField(max_length=20, default='en_US')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT', db_index=True)
    header_type = models.CharField(max_length=20, choices=HEADER_CHOICES, default='NONE')
    header_text = models.CharField(max_length=255, blank=True)
    body_text = models.TextField(help_text="Template body content with variables like {{1}}, {{2}}")
    footer_text = models.CharField(max_length=255, blank=True)
    buttons = models.JSONField(default=list, blank=True, help_text="List of quick reply or call-to-action buttons")
    meta_template_id = models.CharField(max_length=100, blank=True, db_index=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('client', 'name', 'language')
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['client', 'category']),
        ]

    def __str__(self):
        return f"{self.name} [{self.category}] - {self.status}"
