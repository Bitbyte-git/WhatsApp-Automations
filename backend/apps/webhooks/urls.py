from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.webhooks.views import MetaWhatsAppWebhookView, WebhookLogViewSet

router = SimpleRouter()
router.register(r'logs', WebhookLogViewSet, basename='webhook-log')

urlpatterns = [
    path('whatsapp/', MetaWhatsAppWebhookView.as_view(), name='meta-whatsapp-webhook'),
    path('', include(router.urls)),
]
