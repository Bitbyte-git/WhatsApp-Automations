from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.chatbot.views import ChatbotConfigViewSet, KnowledgeDocumentViewSet

router = SimpleRouter()
router.register(r'documents', KnowledgeDocumentViewSet, basename='chatbot-document')
router.register(r'config', ChatbotConfigViewSet, basename='chatbot-config')

urlpatterns = [
    path('', include(router.urls)),
]
