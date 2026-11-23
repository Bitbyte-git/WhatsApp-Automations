from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.campaigns.views import CampaignViewSet

router = SimpleRouter()
router.register(r'', CampaignViewSet, basename='campaign')

urlpatterns = [
    path('', include(router.urls)),
]
