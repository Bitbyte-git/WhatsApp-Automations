from rest_framework import permissions

class IsSuperAdminUser(permissions.BasePermission):
    """
    Allows access only to Super Admins (BitByte platform administrators).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'SUPERADMIN' or request.user.is_superuser)
        )

class IsClientAdmin(permissions.BasePermission):
    """
    Allows access to Super Admins and Client Admins.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ['SUPERADMIN', 'CLIENT_ADMIN'] or request.user.is_superuser

class IsTenantMember(permissions.BasePermission):
    """
    Ensures that a user can only access resources belonging to their own tenant/client.
    Superadmins can access all clients.
    """
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == 'SUPERADMIN' or request.user.is_superuser:
            return True
        
        # Check object client ownership
        if hasattr(obj, 'client_id'):
            return obj.client_id == request.user.client_id
        if hasattr(obj, 'client'):
            return obj.client == request.user.client
        if hasattr(obj, 'id') and obj.__class__.__name__ == 'Client':
            return obj.id == request.user.client_id
        return False
