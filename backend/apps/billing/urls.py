from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.billing.views import (
    WalletView,
    RechargeWalletView,
    TransactionViewSet,
    UsageRecordViewSet,
    InvoiceViewSet,
)

router = SimpleRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'usage', UsageRecordViewSet, basename='usage-record')
router.register(r'invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('wallet/', WalletView.as_view(), name='wallet-detail'),
    path('wallet/recharge/', RechargeWalletView.as_view(), name='wallet-recharge'),
    path('', include(router.urls)),
]
