from django.urls import path, include
from rest_framework.routers import SimpleRouter
from apps.clients.views import ClientViewSet, ClientMembershipViewSet

router = SimpleRouter()
router.register(r'memberships', ClientMembershipViewSet, basename='client-membership')
router.register(r'', ClientViewSet, basename='client')

urlpatterns = [
    path('', include(router.urls)),
]
