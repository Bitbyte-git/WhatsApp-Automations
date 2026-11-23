from django.db import models
from apps.core.models import TimeStampedModel

class Contact(TimeStampedModel):
    """
    Customer contact record owned by a specific client tenant.
    """
    STATUS_CHOICES = [
        ('OPTED_IN', 'Opted-in'),
        ('OPTED_OUT', 'Opted-out'),
        ('BLOCKED', 'Blocked'),
    ]

    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='contacts',
        db_index=True
    )
    phone_number = models.CharField(max_length=50, db_index=True)
    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    country_code = models.CharField(max_length=10, blank=True)
    tags = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPTED_IN', db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('client', 'phone_number')
        indexes = [
            models.Index(fields=['client', 'phone_number']),
            models.Index(fields=['client', 'status']),
        ]

    def __str__(self):
        return f"{self.name or 'Unknown'} ({self.phone_number})"


class Conversation(TimeStampedModel):
    """
    Active or historical WhatsApp chat thread between a customer Contact
    and a specific client's WhatsApp Account.
    """
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('PENDING', 'Pending'),
        ('CLOSED', 'Closed'),
    ]

    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='conversations',
        db_index=True
    )
    whatsapp_account = models.ForeignKey(
        'whatsapp.WhatsAppAccount',
        on_delete=models.CASCADE,
        related_name='conversations',
        db_index=True
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name='conversations',
        db_index=True
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN', db_index=True)
    unread_count = models.PositiveIntegerField(default=0)
    last_message_at = models.DateTimeField(null=True, blank=True, db_index=True)
    last_message_preview = models.CharField(max_length=500, blank=True)
    assigned_agent = models.ForeignKey(
        'authentication.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_conversations'
    )

    class Meta:
        ordering = ['-last_message_at', '-created_at']
        unique_together = ('whatsapp_account', 'contact')
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['client', 'last_message_at']),
        ]

    def __str__(self):
        return f"Chat with {self.contact.phone_number} on {self.whatsapp_account.business_name}"


class Message(TimeStampedModel):
    """
    Individual WhatsApp message (inbound from customer or outbound from agent/bot/campaign).
    """
    DIRECTION_CHOICES = [
        ('INBOUND', 'Inbound (From Customer)'),
        ('OUTBOUND', 'Outbound (To Customer)'),
    ]

    TYPE_CHOICES = [
        ('TEXT', 'Text'),
        ('IMAGE', 'Image'),
        ('VIDEO', 'Video'),
        ('DOCUMENT', 'Document'),
        ('AUDIO', 'Audio'),
        ('TEMPLATE', 'Template Message'),
        ('INTERACTIVE', 'Interactive / Quick Reply'),
        ('LOCATION', 'Location'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('READ', 'Read'),
        ('FAILED', 'Failed'),
    ]

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True
    )
    whatsapp_account = models.ForeignKey(
        'whatsapp.WhatsAppAccount',
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True
    )
    wamid = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        db_index=True,
        help_text="Meta WhatsApp Message ID (wamid)"
    )
    direction = models.CharField(max_length=15, choices=DIRECTION_CHOICES, db_index=True)
    message_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='TEXT')
    content = models.TextField(blank=True)
    media_url = models.URLField(blank=True, max_length=1000)
    media_caption = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    error_code = models.CharField(max_length=50, blank=True)
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    raw_metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['client', 'direction', 'status']),
            models.Index(fields=['client', 'created_at']),
            models.Index(fields=['wamid']),
        ]

    def __str__(self):
        return f"Msg {self.id} [{self.direction} - {self.status}]: {self.content[:30]}"
