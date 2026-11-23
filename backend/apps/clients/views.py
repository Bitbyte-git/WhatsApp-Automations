from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.clients.models import Client, ClientMembership
from apps.clients.serializers import ClientSerializer, ClientMembershipSerializer
from apps.core.permissions import IsSuperAdminUser
from apps.billing.models import Wallet

class ClientViewSet(viewsets.ModelViewSet):
    """
    CRUD for tenant clients.
    Superadmins can manage all clients; Client admins can only view their own client.
    """
    serializer_class = ClientSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['name', 'company_email', 'phone_number']
    ordering_fields = ['name', 'created_at', 'status']

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Client.objects.none()
        if user.is_superadmin:
            return Client.objects.all().prefetch_related('whatsapp_accounts', 'users').select_related('wallet')
        if user.client:
            return Client.objects.filter(id=user.client.id).prefetch_related('whatsapp_accounts', 'users').select_related('wallet')
        return Client.objects.none()

    def perform_create(self, serializer):
        client = serializer.save()
        # Automatically create client wallet on client onboarding
        Wallet.objects.get_or_create(client=client, defaults={'balance': 0.0000})

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdminUser])
    def toggle_status(self, request, pk=None):
        client = self.get_object()
        new_status = 'INACTIVE' if client.status == 'ACTIVE' else 'ACTIVE'
        client.status = new_status
        client.save(update_fields=['status'])
        return Response({'id': client.id, 'status': client.status, 'message': f'Client status changed to {client.status}'})


class ClientMembershipViewSet(viewsets.ModelViewSet):
    serializer_class = ClientMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superadmin:
            return ClientMembership.objects.all().select_related('client', 'user')
        if user.client:
            return ClientMembership.objects.filter(client=user.client).select_related('client', 'user')
        return ClientMembership.objects.none()
