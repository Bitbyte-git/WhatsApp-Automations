from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.inbox.views import ContactViewSet, ConversationViewSet, MessageViewSet, SendMessageView

router = SimpleRouter()
router.register(r'contacts', ContactViewSet, basename='contact')
router.register(r'conversations', ConversationViewSet, basename='conversation')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('send/', SendMessageView.as_view(), name='send-message'),
    path('', include(router.urls)),
]
