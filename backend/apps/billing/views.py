from rest_framework import viewsets, permissions, filters, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from decimal import Decimal
import uuid

from apps.billing.models import Wallet, WalletTransaction, UsageRecord, Invoice
from apps.billing.serializers import (
    WalletSerializer,
    WalletTransactionSerializer,
    UsageRecordSerializer,
    InvoiceSerializer,
    RechargeWalletSerializer,
)
from apps.clients.models import Client

class WalletView(views.APIView):
    """
    Returns the active wallet for the requesting client.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        target_client = user.client

        if user.is_superadmin:
            client_id = request.query_params.get('client_id')
            if client_id:
                target_client = Client.objects.filter(id=client_id).first()

        if not target_client:
            # Platform superadmin overview of all wallets
            wallets = Wallet.objects.all().select_related('client')
            total_balance = sum(w.balance for w in wallets)
            return Response({
                'overview': True,
                'total_platform_balance': str(total_balance),
                'wallets': WalletSerializer(wallets, many=True).data
            })

        wallet, _ = Wallet.objects.get_or_create(client=target_client, defaults={'balance': 0.0000})
        return Response(WalletSerializer(wallet).data)


class RechargeWalletView(views.APIView):
    """
    Credits funds to client's prepaid wallet and generates transaction ledger record.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RechargeWalletSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        data = serializer.validated_data
        amount = Decimal(str(data['amount']))
        payment_method = data.get('payment_method', 'UPI')
        reference_id = data.get('reference_id') or f"PAY-{uuid.uuid4().hex[:10].upper()}"

        client = user.client
        if user.is_superadmin and data.get('client_id'):
            client = Client.objects.filter(id=data['client_id']).first()

        if not client:
            return Response({'error': 'Client must be specified'}, status=status.HTTP_400_BAD_REQUEST)

        wallet, _ = Wallet.objects.get_or_create(client=client, defaults={'balance': 0.0000})
        wallet.balance += amount
        wallet.save(update_fields=['balance'])

        tx = WalletTransaction.objects.create(
            wallet=wallet,
            client=client,
            transaction_type='CREDIT',
            amount=amount,
            balance_after=wallet.balance,
            category='RECHARGE',
            description=f"Wallet recharge via {payment_method}",
            reference_id=reference_id,
            payment_method=payment_method,
            status='SUCCESS'
        )

        return Response({
            'message': f"Wallet successfully recharged with INR {amount}",
            'transaction': WalletTransactionSerializer(tx).data,
            'wallet': WalletSerializer(wallet).data
        })


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Full ledger of all transactions with filters by type, category, date, and reference.
    """
    serializer_class = WalletTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reference_id', 'description', 'category']
    ordering_fields = ['created_at', 'amount', 'category']

    def get_queryset(self):
        user = self.request.user
        tx_type = self.request.query_params.get('type')
        category = self.request.query_params.get('category')

        qs = WalletTransaction.objects.none()
        if user.is_superadmin:
            client_id = self.request.query_params.get('client_id')
            if client_id:
                qs = WalletTransaction.objects.filter(client_id=client_id)
            else:
                qs = WalletTransaction.objects.all()
        elif user.client:
            qs = WalletTransaction.objects.filter(client=user.client)

        if tx_type:
            qs = qs.filter(transaction_type=tx_type.upper())
        if category:
            qs = qs.filter(category=category.upper())

        return qs.select_related('client', 'wallet').order_by('-created_at')


class UsageRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Detailed audit of message costs: Meta charges, platform markup, and taxes.
    """
    serializer_class = UsageRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering_fields = ['created_at', 'total_cost']

    def get_queryset(self):
        user = self.request.user
        qs = UsageRecord.objects.none()
        if user.is_superadmin:
            client_id = self.request.query_params.get('client_id')
            if client_id:
                qs = UsageRecord.objects.filter(client_id=client_id)
            else:
                qs = UsageRecord.objects.all()
        elif user.client:
            qs = UsageRecord.objects.filter(client=user.client)

        category = self.request.query_params.get('category')
        if category:
            qs = qs.filter(category=category.upper())

        return qs.select_related('client', 'whatsapp_account').order_by('-created_at')


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Client billing invoices.
    """
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superadmin:
            client_id = self.request.query_params.get('client_id')
            if client_id:
                return Invoice.objects.filter(client_id=client_id).select_related('client')
            return Invoice.objects.all().select_related('client')
        if user.client:
            return Invoice.objects.filter(client=user.client).select_related('client')
        return Invoice.objects.none()
