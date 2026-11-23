from django.db import models
from apps.core.models import TimeStampedModel

class WhatsAppAccount(TimeStampedModel):
    """
    Connected WhatsApp Business Account (WABA) and phone number via Meta Cloud API.
    Isolated per Client tenant.
    """
    QUALITY_CHOICES = [
        ('UNKNOWN', 'Unknown / Initializing'),
        ('GREEN', 'High (Green)'),
        ('YELLOW', 'Medium (Yellow)'),
        ('RED', 'Low (Red)'),
    ]

    CONNECTION_CHOICES = [
        ('CONNECTED', 'Connected'),
        ('DISCONNECTED', 'Disconnected'),
        ('PENDING_CONFIGURATION', 'Pending Configuration'),
        ('RESTRICTED', 'Restricted'),
    ]

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('SUSPENDED', 'Suspended'),
    ]

    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='whatsapp_accounts',
        db_index=True
    )
    business_name = models.CharField(max_length=255)
    waba_id = models.CharField(max_length=100, db_index=True, help_text="Meta WhatsApp Business Account ID")
    phone_number = models.CharField(max_length=50, help_text="E.164 phone number, e.g. +919876543210")
    phone_number_id = models.CharField(max_length=100, unique=True, db_index=True, help_text="Meta Phone Number ID")
    display_phone_number = models.CharField(max_length=50, blank=True)
    quality_rating = models.CharField(max_length=20, choices=QUALITY_CHOICES, default='UNKNOWN')
    connection_status = models.CharField(max_length=30, choices=CONNECTION_CHOICES, default='PENDING_CONFIGURATION', db_index=True)
    account_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    is_default = models.BooleanField(default=False)
    access_token = models.CharField(max_length=500, blank=True, help_text="System user or permanent access token")
    webhook_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ['-is_default', '-created_at']
        indexes = [
            models.Index(fields=['client', 'connection_status']),
            models.Index(fields=['phone_number_id']),
            models.Index(fields=['waba_id']),
        ]

    def save(self, *args, **kwargs):
        if self.is_default:
            WhatsAppAccount.objects.filter(client=self.client).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.business_name} ({self.phone_number})"


class WebhookEvent(models.Model):
    """
    Audit log of raw incoming webhook payloads received from Meta Cloud API.
    Used for signature verification, deduplication, and replay debugging.
    """
    STATUS_CHOICES = [
        ('RECEIVED', 'Received'),
        ('PROCESSED', 'Processed'),
        ('FAILED', 'Failed'),
        ('IGNORED', 'Ignored'),
    ]

    event_id = models.CharField(max_length=255, unique=True, db_index=True)
    event_type = models.CharField(max_length=100, db_index=True, blank=True)
    whatsapp_account = models.ForeignKey(
        WhatsAppAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='webhook_events'
    )
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='RECEIVED', db_index=True)
    error_message = models.TextField(blank=True)
    received_at = models.DateTimeField(auto_now_add=True, db_index=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-received_at']
        indexes = [
            models.Index(fields=['event_type', 'status']),
            models.Index(fields=['received_at']),
        ]

    def __str__(self):
        return f"Event {self.event_id} - {self.event_type} ({self.status})"
