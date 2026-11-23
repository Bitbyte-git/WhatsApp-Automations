from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.templates_manager.views import MessageTemplateViewSet

router = SimpleRouter()
router.register(r'', MessageTemplateViewSet, basename='template')

urlpatterns = [
    path('', include(router.urls)),
]
