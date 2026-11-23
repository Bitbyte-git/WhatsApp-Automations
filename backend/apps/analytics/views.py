from rest_framework import views, permissions
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta

from apps.clients.models import Client
from apps.whatsapp.models import WhatsAppAccount
from apps.inbox.models import Message
from apps.billing.models import Wallet, WalletTransaction, UsageRecord
from apps.inbox.serializers import MessageSerializer
from apps.clients.serializers import ClientSerializer
from apps.billing.serializers import WalletTransactionSerializer

class OverviewStatsView(views.APIView):
    """
    Returns authentic summary metrics computed directly from database tables.
    Never uses mock data or hardcoded numbers.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        target_client = user.client if not user.is_superadmin else None

        client_filter = request.query_params.get('client_id')
        if user.is_superadmin and client_filter:
            target_client = Client.objects.filter(id=client_filter).first()

        # Messages query
        msg_qs = Message.objects.all()
        acct_qs = WhatsAppAccount.objects.all()
        wallet_qs = Wallet.objects.all()
        client_count = Client.objects.filter(status='ACTIVE').count()

        if target_client:
            msg_qs = msg_qs.filter(client=target_client)
            acct_qs = acct_qs.filter(client=target_client)
            wallet_qs = wallet_qs.filter(client=target_client)
            client_count = 1

        total_sent = msg_qs.filter(direction='OUTBOUND', status__in=['SENT', 'DELIVERED', 'READ']).count()
        total_delivered = msg_qs.filter(status__in=['DELIVERED', 'READ']).count()
        total_failed = msg_qs.filter(status='FAILED').count()
        connected_accounts = acct_qs.filter(connection_status='CONNECTED').count()
        total_accounts = acct_qs.count()

        total_wallet_balance = wallet_qs.aggregate(total=Sum('balance'))['total'] or 0

        # Message category counts
        usage_qs = UsageRecord.objects.all()
        if target_client:
            usage_qs = usage_qs.filter(client=target_client)

        categories = {
            'marketing': usage_qs.filter(category='MARKETING').count(),
            'utility': usage_qs.filter(category='UTILITY').count(),
            'authentication': usage_qs.filter(category='AUTHENTICATION').count(),
            'service': usage_qs.filter(category='SERVICE').count(),
        }

        return Response({
            'total_clients': client_count,
            'connected_accounts': connected_accounts,
            'total_accounts': total_accounts,
            'total_messages_sent': total_sent,
            'total_messages_delivered': total_delivered,
            'total_messages_failed': total_failed,
            'total_wallet_balance': float(total_wallet_balance),
            'category_breakdown': categories,
            'has_data': bool(total_sent > 0 or total_accounts > 0 or client_count > 0)
        })


class MessageUsageAnalyticsView(views.APIView):
    """
    Time-series message usage reports with filters:
    Today, Last 7 Days, Last 30 Days, Custom Range.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        time_range = request.query_params.get('range', '7d')
        now = timezone.now()

        if time_range == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            days = 1
        elif time_range == '30d':
            start_date = now - timedelta(days=30)
            days = 30
        else: # default 7d
            start_date = now - timedelta(days=7)
            days = 7

        msg_qs = Message.objects.filter(created_at__gte=start_date)
        if not user.is_superadmin and user.client:
            msg_qs = msg_qs.filter(client=user.client)
        elif user.is_superadmin and request.query_params.get('client_id'):
            msg_qs = msg_qs.filter(client_id=request.query_params.get('client_id'))

        # Aggregate daily counts
        daily_series = []
        for i in range(days):
            day_start = (start_date + timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            day_label = day_start.strftime('%b %d')

            day_msgs = msg_qs.filter(created_at__gte=day_start, created_at__lt=day_end)
            sent = day_msgs.filter(direction='OUTBOUND', status__in=['SENT', 'DELIVERED', 'READ']).count()
            delivered = day_msgs.filter(status__in=['DELIVERED', 'READ']).count()
            failed = day_msgs.filter(status='FAILED').count()

            daily_series.append({
                'date': day_label,
                'sent': sent,
                'delivered': delivered,
                'failed': failed,
            })

        # Category usage
        usage_qs = UsageRecord.objects.filter(created_at__gte=start_date)
        if not user.is_superadmin and user.client:
            usage_qs = usage_qs.filter(client=user.client)

        categories = {
            'marketing': usage_qs.filter(category='MARKETING').count(),
            'utility': usage_qs.filter(category='UTILITY').count(),
            'authentication': usage_qs.filter(category='AUTHENTICATION').count(),
            'service': usage_qs.filter(category='SERVICE').count(),
        }

        total_in_period = msg_qs.count()

        return Response({
            'range': time_range,
            'total_messages': total_in_period,
            'time_series': daily_series,
            'categories': categories,
            'has_records': total_in_period > 0
        })


class RecentActivityView(views.APIView):
    """
    Returns actual recent client registrations, transactions, and message activities.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        limit = int(request.query_params.get('limit', 5))

        client_id = request.query_params.get('client_id')
        target_client = user.client if not user.is_superadmin else None
        if user.is_superadmin and client_id:
            target_client = Client.objects.filter(id=client_id).first()

        # Recent registrations (superadmin only or relevant client)
        recent_clients = []
        if user.is_superadmin:
            clients_qs = Client.objects.all().order_by('-created_at')[:limit]
            recent_clients = ClientSerializer(clients_qs, many=True).data

        # Recent transactions
        tx_qs = WalletTransaction.objects.all().order_by('-created_at')
        if target_client:
            tx_qs = tx_qs.filter(client=target_client)
        recent_txs = WalletTransactionSerializer(tx_qs[:limit], many=True).data

        # Recent messages
        msg_qs = Message.objects.all().select_related('contact', 'whatsapp_account').order_by('-created_at')
        if target_client:
            msg_qs = msg_qs.filter(client=target_client)
        recent_messages = MessageSerializer(msg_qs[:limit], many=True).data

        return Response({
            'recent_clients': recent_clients,
            'recent_transactions': recent_txs,
            'recent_messages': recent_messages,
        })
