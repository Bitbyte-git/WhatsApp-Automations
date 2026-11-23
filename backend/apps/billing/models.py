from django.db import models
from apps.core.models import TimeStampedModel

class Wallet(TimeStampedModel):
    """
    Prepaid credit wallet dedicated to each client.
    Tracks total balance, low balance alert threshold, and lock state.
    """
    client = models.OneToOneField(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='wallet',
        db_index=True
    )
    balance = models.DecimalField(max_digits=12, decimal_places=4, default=0.0000)
    currency = models.CharField(max_length=10, default='INR')
    low_balance_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    is_locked = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.client.name} Wallet: {self.currency} {self.balance}"

    @property
    def is_low_balance(self):
        return self.balance <= self.low_balance_threshold


class WalletTransaction(models.Model):
    """
    Immutable ledger of all wallet credits (recharges/refunds) and debits
    (Marketing, Utility, Auth, Service messages & platform charges).
    """
    TRANSACTION_TYPES = [
        ('CREDIT', 'Credit (Recharge / Refund)'),
        ('DEBIT', 'Debit (Message Usage / Platform Fee)'),
    ]

    CATEGORY_CHOICES = [
        ('RECHARGE', 'Wallet Recharge'),
        ('MARKETING', 'Marketing Message Usage'),
        ('UTILITY', 'Utility Message Usage'),
        ('AUTHENTICATION', 'Authentication Message Usage'),
        ('SERVICE', 'Service Conversation Usage'),
        ('PLATFORM_FEE', 'Platform Subscription / Markup'),
        ('REFUND', 'Refund / Adjustment'),
    ]

    STATUS_CHOICES = [
        ('SUCCESS', 'Success'),
        ('PENDING', 'Pending'),
        ('FAILED', 'Failed'),
    ]

    wallet = models.ForeignKey(
        Wallet,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='transactions',
        db_index=True
    )
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=4)
    balance_after = models.DecimalField(max_digits=12, decimal_places=4)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, db_index=True)
    description = models.TextField()
    reference_id = models.CharField(max_length=100, blank=True, db_index=True)
    payment_method = models.CharField(max_length=50, blank=True, default='MANUAL')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SUCCESS', db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'transaction_type']),
            models.Index(fields=['client', 'created_at']),
            models.Index(fields=['reference_id']),
        ]

    def __str__(self):
        return f"{self.client.name} - {self.transaction_type} {self.amount} ({self.category})"


class UsageRecord(models.Model):
    """
    Detailed granular audit for every billable WhatsApp message or conversation,
    separating Meta's official charges from BitByte platform fees and taxes.
    """
    CATEGORY_CHOICES = [
        ('MARKETING', 'Marketing'),
        ('UTILITY', 'Utility'),
        ('AUTHENTICATION', 'Authentication'),
        ('SERVICE', 'Service'),
    ]

    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='usage_records',
        db_index=True
    )
    whatsapp_account = models.ForeignKey(
        'whatsapp.WhatsAppAccount',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    message = models.ForeignKey(
        'inbox.Message',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, db_index=True)
    meta_cost = models.DecimalField(max_digits=10, decimal_places=4, default=0.0000)
    platform_fee = models.DecimalField(max_digits=10, decimal_places=4, default=0.0000)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=4, default=0.0000)
    total_cost = models.DecimalField(max_digits=10, decimal_places=4, default=0.0000)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'category', 'created_at']),
        ]

    def __str__(self):
        return f"{self.client.name} - {self.category} Total: {self.total_cost}"


class Invoice(TimeStampedModel):
    """
    Billing invoices generated for monthly client message usage and platform subscriptions.
    """
    STATUS_CHOICES = [
        ('PAID', 'Paid'),
        ('PENDING', 'Pending Payment'),
        ('CANCELLED', 'Cancelled'),
    ]

    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='invoices',
        db_index=True
    )
    invoice_number = models.CharField(max_length=100, unique=True, db_index=True)
    period_start = models.DateField()
    period_end = models.DateField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PAID', db_index=True)
    invoice_pdf_url = models.URLField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['invoice_number']),
        ]

    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.client.name} ({self.total_amount})"
