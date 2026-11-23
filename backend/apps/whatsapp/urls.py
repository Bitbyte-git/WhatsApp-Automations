from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.whatsapp.views import WhatsAppAccountViewSet, MetaConfigStatusView

router = SimpleRouter()
router.register(r'accounts', WhatsAppAccountViewSet, basename='whatsapp-account')

urlpatterns = [
    path('status/', MetaConfigStatusView.as_view(), name='meta-config-status'),
    path('', include(router.urls)),
]
