import logging

logger = logging.getLogger(__name__)

class TenantContextMiddleware:
    """
    Middleware that determines the active tenant/client from the request.
    Tenant is resolved by:
    1. Authenticated user's assigned client
    2. Optional 'X-Tenant-ID' header (allowed only if the user is a SUPERADMIN)
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.tenant = None
        
        # User is authenticated via session or will be authenticated later in DRF
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            # If user has an assigned client, that is their fixed tenant
            if getattr(user, 'client', None):
                request.tenant = user.client
            elif getattr(user, 'role', '') == 'SUPERADMIN' or getattr(user, 'is_superuser', False):
                # Superadmin can switch tenant view via X-Tenant-ID header
                tenant_id = request.headers.get('X-Tenant-ID')
                if tenant_id:
                    from apps.clients.models import Client
                    try:
                        request.tenant = Client.objects.filter(id=tenant_id).first()
                    except Exception as e:
                        logger.warning(f"Invalid X-Tenant-ID header: {tenant_id}, error: {e}")

        response = self.get_response(request)
        return response
