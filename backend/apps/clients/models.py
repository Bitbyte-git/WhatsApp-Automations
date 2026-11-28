from django.db import models
from django.utils.text import slugify
from apps.core.models import TimeStampedModel

class Client(TimeStampedModel):
    """
    Tenant entity representing an independent business/client on BitByte WhatsApp SaaS.
    All data (WhatsApp accounts, contacts, conversations, templates, campaigns, wallets)
    is isolated per Client.
    """
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('INACTIVE', 'Inactive'),
        ('SUSPENDED', 'Suspended'),
    ]

    name = models.CharField(max_length=255, unique=True, db_index=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    company_email = models.EmailField(db_index=True)
    phone_number = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    website = models.URLField(blank=True)
    timezone = models.CharField(max_length=100, default='Asia/Kolkata')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE', db_index=True)
    max_whatsapp_accounts = models.PositiveIntegerField(default=5)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Client.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ClientMembership(TimeStampedModel):
    """
    Associates users with clients and their specific permission role inside the tenant.
    """
    ROLE_CHOICES = [
        ('ADMIN', 'Client Admin'),
        ('MANAGER', 'Campaign Manager'),
        ('AGENT', 'Support Agent'),
    ]

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey('authentication.User', on_delete=models.CASCADE, related_name='client_memberships')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='AGENT')

    class Meta:
        unique_together = ('client', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.client.name} ({self.role})"


class ClientApiKey(TimeStampedModel):
    """
    Client developer API Keys for external integrations (e.g. websites, mobile apps).
    All OTPs dispatched through this key route via BitByte's verified master gateway (+91 99444 95366).
    """
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='api_keys')
    project_name = models.CharField(max_length=150, help_text="Client application or project name")
    key = models.CharField(max_length=80, unique=True, db_index=True)
    template_name = models.CharField(max_length=150, blank=True, default='')
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project_name} ({self.client.name}) - {self.key[:15]}..."
