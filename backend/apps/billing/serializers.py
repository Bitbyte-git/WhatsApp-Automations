from rest_framework import serializers
from apps.billing.models import Wallet, WalletTransaction, UsageRecord, Invoice

class WalletSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    is_low_balance = serializers.BooleanField(read_only=True)

    class Meta:
        model = Wallet
        fields = [
            'id', 'client', 'client_name', 'balance',
            'currency', 'low_balance_threshold', 'is_locked',
            'is_low_balance', 'updated_at'
        ]
        read_only_fields = ['id', 'updated_at', 'is_low_balance']


class WalletTransactionSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = WalletTransaction
        fields = [
            'id', 'wallet', 'client', 'client_name',
            'transaction_type', 'amount', 'balance_after',
            'category', 'description', 'reference_id',
            'payment_method', 'status', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class UsageRecordSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    whatsapp_account_name = serializers.CharField(source='whatsapp_account.business_name', read_only=True)

    class Meta:
        model = UsageRecord
        fields = [
            'id', 'client', 'client_name', 'whatsapp_account',
            'whatsapp_account_name', 'message', 'category',
            'meta_cost', 'platform_fee', 'tax_amount', 'total_cost',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 'client', 'client_name', 'invoice_number',
            'period_start', 'period_end', 'subtotal', 'tax_amount',
            'total_amount', 'status', 'invoice_pdf_url', 'due_date',
            'paid_at', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class RechargeWalletSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=10.00)
    payment_method = serializers.CharField(max_length=50, default='UPI')
    reference_id = serializers.CharField(max_length=100, required=False, allow_blank=True)
    client_id = serializers.IntegerField(required=False)
