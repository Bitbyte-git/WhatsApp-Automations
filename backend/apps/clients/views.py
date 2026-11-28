from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.clients.models import Client, ClientMembership, ClientApiKey
from apps.clients.serializers import ClientSerializer, ClientMembershipSerializer, ClientApiKeySerializer
from apps.core.permissions import IsSuperAdminUser
from apps.billing.models import Wallet
import secrets

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


class ClientApiKeyViewSet(viewsets.ModelViewSet):
    """
    Client developer API Keys for external integrations (e.g. Vino Fitness, Athirai).
    All OTPs dispatched through this key route via BitByte's verified master gateway (+91 99444 95366).
    """
    serializer_class = ClientApiKeySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superadmin:
            client_id = self.request.query_params.get('client_id')
            if client_id:
                return ClientApiKey.objects.filter(client_id=client_id)
            return ClientApiKey.objects.all().select_related('client')
        if user.client:
            return ClientApiKey.objects.filter(client=user.client).select_related('client')
        return ClientApiKey.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        target_client = None
        if user.is_superadmin:
            client_id = self.request.data.get('client_id')
            if client_id:
                target_client = Client.objects.filter(id=client_id).first()
            if not target_client:
                target_client = Client.objects.filter(name__icontains='infisq').first() or Client.objects.first()
        else:
            target_client = user.client

        random_hex = secrets.token_hex(20)
        api_key = f"bb_live_{random_hex}"
        project_name = self.request.data.get('project_name', '').strip() or 'My Project'
        template_name = self.request.data.get('template_name', '').strip()
        if not template_name:
            from apps.templates_manager.models import MessageTemplate
            tmpl = MessageTemplate.objects.filter(category='AUTHENTICATION', status='APPROVED').order_by('-id').first()
            template_name = tmpl.name if tmpl else ''

        serializer.save(
            client=target_client,
            project_name=project_name,
            key=api_key,
            template_name=template_name,
            is_active=True
        )
