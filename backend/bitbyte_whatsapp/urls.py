"""
Root URL Configuration for BitByte WhatsApp SaaS Platform.
"""

from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse
from django.conf import settings
from django.views.generic import TemplateView
import os

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'BitByte WhatsApp SaaS Platform API',
        'version': '1.0.0',
        'company': 'BitByte Technologies',
        'database': 'Neon PostgreSQL' if os.environ.get('DATABASE_URL') else 'SQLite Development',
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/clients/', include('apps.clients.urls')),
    path('api/whatsapp/', include('apps.whatsapp.urls')),
    path('api/inbox/', include('apps.inbox.urls')),
    path('api/templates/', include('apps.templates_manager.urls')),
    path('api/campaigns/', include('apps.campaigns.urls')),
    path('api/chatbot/', include('apps.chatbot.urls')),
    path('api/billing/', include('apps.billing.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/webhooks/', include('apps.webhooks.urls')),
    path('api/settings/', include('apps.settings_manager.urls')),
    path('api/media/', include('apps.media_library.urls')),
]

# Serve React SPA index.html for frontend routes if built
frontend_index = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'index.html'
if frontend_index.exists():
    urlpatterns.append(
        re_path(r'^(?!api/|admin/|static/|media/).*$', TemplateView.as_view(template_name='index.html'), name='frontend-spa')
    )
