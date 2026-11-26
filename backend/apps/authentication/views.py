import os
from rest_framework import status, views, permissions, viewsets
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from apps.authentication.models import User
from apps.authentication.serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
)
from apps.core.permissions import IsSuperAdminUser

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'message': 'Registration successful'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = str(request.data.get('email', '')).strip().lower()
        password = str(request.data.get('password', '')).strip()

        # Instant 1-second Master Admin Login (via Render Environment or hardcoded master)
        admin_env_email = os.environ.get('ADMIN_EMAIL', 'bitbyte.senthil@gmail.com').strip().lower()
        admin_env_password = os.environ.get('ADMIN_PASSWORD', 'Senthil@2026').strip()

        is_master_admin = (
            (email == admin_env_email and (password == admin_env_password or password.lower() == admin_env_password.lower())) or
            (email == 'bitbyte.senthil@gmail.com' and password in ['Senthil@2026', 'senthil@2026']) or
            (email == 'admin@bitbytetech.org' and password in ['ChangeMe@123', 'Senthil@2026'])
        )

        if is_master_admin:
            user = User.objects.select_related('client').filter(email=email).first()
            if not user:
                user = User.objects.create(
                    email=email,
                    full_name='Senthilkumar S (BitByte Founder)' if 'senthil' in email else 'BitByte System Admin',
                    role='SUPERADMIN',
                    is_staff=True,
                    is_superuser=True,
                    is_active=True,
                    phone_number='+919944495366'
                )
            # Ensure superadmin privileges are guaranteed
            elif not user.is_superuser or not user.is_staff or user.role != 'SUPERADMIN' or not user.is_active:
                user.is_superuser = True
                user.is_staff = True
                user.role = 'SUPERADMIN'
                user.is_active = True
                user.save(update_fields=['is_superuser', 'is_staff', 'role', 'is_active'])

            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'message': 'Login successful'
            })

        # Standard Customer / Client Login
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                },
                'message': 'Login successful'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response({'error': 'Old and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(old_password):
            return Response({'error': 'Incorrect current password'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 6:
            return Response({'error': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password updated successfully'})


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsSuperAdminUser]
    queryset = User.objects.all().order_by('-date_joined')
