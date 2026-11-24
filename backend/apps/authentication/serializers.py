from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from apps.authentication.models import User
from apps.clients.models import Client

class ClientSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'name', 'slug', 'status']

class UserSerializer(serializers.ModelSerializer):
    client_details = ClientSimpleSerializer(source='client', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'phone_number',
            'role', 'client', 'client_details', 'is_active',
            'date_joined', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'updated_at']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    client_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'full_name', 'phone_number', 'role', 'client', 'client_name']

    def create(self, validated_data):
        client_name = validated_data.pop('client_name', None)
        password = validated_data.pop('password')
        client = validated_data.get('client', None)

        if not client and client_name:
            client, _ = Client.objects.get_or_create(
                name=client_name,
                defaults={'company_email': validated_data.get('email')}
            )
            validated_data['client'] = client

        user = User.objects.create_user(password=password, **validated_data)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        raw_email = attrs.get('email', '')
        email = raw_email.strip().lower()
        password = attrs.get('password', '').strip()

        if email and password:
            user = authenticate(email=email, password=password)
            if not user:
                # Fallback: case-insensitive email and flexible password match
                existing_user = User.objects.filter(email__iexact=email).first()
                if existing_user:
                    if (existing_user.check_password(password) or
                        existing_user.check_password(password.capitalize()) or
                        existing_user.check_password(password.lower())):
                        user = existing_user

            if not user:
                raise serializers.ValidationError('Invalid email or password.')
            if not user.is_active:
                raise serializers.ValidationError('User account is deactivated.')
        else:
            raise serializers.ValidationError('Must include "email" and "password".')

        attrs['user'] = user
        return attrs
