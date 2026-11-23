from django.db import models
from apps.core.models import TimeStampedModel

class Campaign(TimeStampedModel):
    """
    Broadcast campaign targeting a list of contacts with an approved WhatsApp template.
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]

    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='campaigns',
        db_index=True
    )
    whatsapp_account = models.ForeignKey(
        'whatsapp.WhatsAppAccount',
        on_delete=models.CASCADE,
        related_name='campaigns',
        db_index=True
    )
    template = models.ForeignKey(
        'templates_manager.MessageTemplate',
        on_delete=models.CASCADE,
        related_name='campaigns'
    )
    name = models.CharField(max_length=255)
    scheduled_at = models.DateTimeField(null=True, blank=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT', db_index=True)
    total_recipients = models.PositiveIntegerField(default=0)
    sent_count = models.PositiveIntegerField(default=0)
    delivered_count = models.PositiveIntegerField(default=0)
    read_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    template_params = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['scheduled_at', 'status']),
        ]

    def __str__(self):
        return f"{self.name} ({self.status}) - {self.total_recipients} recipients"


class CampaignRecipient(TimeStampedModel):
    """
    Individual contact delivery tracking within a campaign.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('READ', 'Read'),
        ('FAILED', 'Failed'),
    ]

    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.CASCADE,
        related_name='recipients',
        db_index=True
    )
    contact = models.ForeignKey(
        'inbox.Contact',
        on_delete=models.CASCADE,
        related_name='campaign_deliveries'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)
    message = models.ForeignKey(
        'inbox.Message',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    wamid = models.CharField(max_length=255, blank=True, db_index=True)
    error_message = models.TextField(blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('campaign', 'contact')
        indexes = [
            models.Index(fields=['campaign', 'status']),
        ]

    def __str__(self):
        return f"{self.campaign.name} -> {self.contact.phone_number}: {self.status}"
