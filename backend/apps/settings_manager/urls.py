from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.settings_manager.views import PlatformSettingsView, NotificationViewSet

router = SimpleRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('platform/', PlatformSettingsView.as_view(), name='platform-settings'),
    path('', include(router.urls)),
]
