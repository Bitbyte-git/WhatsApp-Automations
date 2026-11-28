from django.urls import path
from apps.templates_manager.views import MessageTemplateViewSet

urlpatterns = [
    path('', MessageTemplateViewSet.as_view({'post': 'send_external_otp'}), name='send_external_otp'),
]
