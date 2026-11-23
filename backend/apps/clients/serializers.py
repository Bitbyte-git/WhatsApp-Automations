from rest_framework import serializers
from apps.clients.models import Client, ClientMembership

class ClientSerializer(serializers.ModelSerializer):
    accounts_count = serializers.IntegerField(source='whatsapp_accounts.count', read_only=True)
    users_count = serializers.IntegerField(source='users.count', read_only=True)
    wallet_balance = serializers.DecimalField(source='wallet.balance', max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Client
        fields = [
            'id', 'name', 'slug', 'company_email', 'phone_number',
            'address', 'website', 'timezone', 'status',
            'max_whatsapp_accounts', 'notes', 'accounts_count',
            'users_count', 'wallet_balance', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class ClientMembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = ClientMembership
        fields = ['id', 'client', 'client_name', 'user', 'user_email', 'user_name', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']
