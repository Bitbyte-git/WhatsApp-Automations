import requests
import logging
from django.conf import settings
from rest_framework import views, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import MarketingImage
from .serializers import MarketingImageSerializer

logger = logging.getLogger(__name__)

MAX_IMAGES_PER_CLIENT = 3


def _get_client(user):
    """Returns the client for a user (superadmin uses own BitByte client)."""
    if user.is_superadmin:
        # Superadmin uploads are global/admin-level
        from apps.clients.models import Client
        return Client.objects.filter(id=1).first() or Client.objects.first()
    return user.client


def _upload_to_cloudinary(file_bytes, public_id_prefix, filename):
    """
    Uploads image bytes to Cloudinary, converts to WebP via eager transformation.
    Returns dict with public_id, secure_url, eager webp_url, width, height, bytes.
    """
    cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', '')
    api_key = getattr(settings, 'CLOUDINARY_API_KEY', '')
    api_secret = getattr(settings, 'CLOUDINARY_API_SECRET', '')

    if not all([cloud_name, api_key, api_secret]):
        return {'success': False, 'error': 'Cloudinary credentials not configured.'}

    upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"

    # Eager transformation: convert to WebP, optimise quality
    data = {
        'upload_preset': None,
        'public_id': f"{public_id_prefix}/{filename}",
        'folder': 'bitbyte_marketing',
        'eager': 'f_webp,q_auto:good',
        'eager_async': 'false',
        'api_key': api_key,
    }
    # Remove None values
    data = {k: v for k, v in data.items() if v is not None}

    files = {'file': (filename, file_bytes, 'application/octet-stream')}

    try:
        import hashlib, time, hmac
        timestamp = int(time.time())

        # Build signature string
        params_to_sign = {
            'eager': 'f_webp,q_auto:good',
            'folder': 'bitbyte_marketing',
            'public_id': f"{public_id_prefix}/{filename}",
            'timestamp': timestamp,
        }
        sorted_params = '&'.join(f"{k}={v}" for k, v in sorted(params_to_sign.items()))
        signature_str = sorted_params + api_secret
        signature = hashlib.sha1(signature_str.encode('utf-8')).hexdigest()

        data['timestamp'] = timestamp
        data['signature'] = signature

        response = requests.post(upload_url, data=data, files=files, timeout=30)
        if response.status_code == 200:
            result = response.json()
            webp_url = ''
            eager = result.get('eager', [])
            if eager:
                webp_url = eager[0].get('secure_url', '')
            # If no eager result, build WebP URL manually
            if not webp_url:
                orig_url = result.get('secure_url', '')
                # Insert f_webp,q_auto:good transformation
                webp_url = orig_url.replace('/upload/', '/upload/f_webp,q_auto:good/')

            return {
                'success': True,
                'public_id': result.get('public_id', ''),
                'secure_url': result.get('secure_url', ''),
                'webp_url': webp_url,
                'width': result.get('width', 0),
                'height': result.get('height', 0),
                'bytes': result.get('bytes', 0),
            }
        else:
            error = response.json().get('error', {}).get('message', 'Upload failed')
            return {'success': False, 'error': error}
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        return {'success': False, 'error': str(e)}


def _delete_from_cloudinary(public_id):
    """Deletes an image from Cloudinary by public_id."""
    cloud_name = getattr(settings, 'CLOUDINARY_CLOUD_NAME', '')
    api_key = getattr(settings, 'CLOUDINARY_API_KEY', '')
    api_secret = getattr(settings, 'CLOUDINARY_API_SECRET', '')

    import hashlib, time
    timestamp = int(time.time())
    signature_str = f"public_id={public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(signature_str.encode('utf-8')).hexdigest()

    delete_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/destroy"
    data = {
        'public_id': public_id,
        'api_key': api_key,
        'timestamp': timestamp,
        'signature': signature,
    }
    try:
        response = requests.post(delete_url, data=data, timeout=15)
        result = response.json()
        return result.get('result') == 'ok'
    except Exception as e:
        logger.error(f"Cloudinary delete error: {e}")
        return False


class MarketingImageUploadView(views.APIView):
    """
    Upload marketing images for WhatsApp broadcasts.
    Max 3 images per client. Stored as WebP via Cloudinary.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        """List all marketing images for this client."""
        client = _get_client(request.user)
        if not client:
            return Response({'error': 'No client found.'}, status=status.HTTP_400_BAD_REQUEST)
        images = MarketingImage.objects.filter(client=client)
        serializer = MarketingImageSerializer(images, many=True)
        return Response({
            'count': images.count(),
            'max_allowed': MAX_IMAGES_PER_CLIENT,
            'can_upload': images.count() < MAX_IMAGES_PER_CLIENT,
            'results': serializer.data
        })

    def post(self, request):
        """Upload a new marketing image (max 3 per client, stored as WebP)."""
        client = _get_client(request.user)
        if not client:
            return Response({'error': 'No client found.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check limit
        existing_count = MarketingImage.objects.filter(client=client).count()
        if existing_count >= MAX_IMAGES_PER_CLIENT:
            return Response({
                'error': f'Maximum {MAX_IMAGES_PER_CLIENT} marketing images allowed. Please delete an existing image first.',
                'current_count': existing_count,
                'max_allowed': MAX_IMAGES_PER_CLIENT,
            }, status=status.HTTP_400_BAD_REQUEST)

        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image file provided. Send as multipart/form-data with key "image".'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        if image_file.content_type not in allowed_types:
            return Response({
                'error': f'Invalid file type: {image_file.content_type}. Allowed: JPEG, PNG, WebP, GIF'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response({'error': 'Image too large. Maximum 5MB allowed.'}, status=status.HTTP_400_BAD_REQUEST)

        image_name = request.data.get('name', '').strip() or image_file.name.rsplit('.', 1)[0]
        file_bytes = image_file.read()
        safe_filename = image_file.name.replace(' ', '_').lower().rsplit('.', 1)[0]
        public_id_prefix = f"client_{client.id}"

        # Upload to Cloudinary
        result = _upload_to_cloudinary(file_bytes, public_id_prefix, safe_filename)
        if not result['success']:
            return Response({'error': f"Cloudinary upload failed: {result['error']}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Save to DB
        img = MarketingImage.objects.create(
            client=client,
            name=image_name,
            cloudinary_public_id=result['public_id'],
            cloudinary_url=result['secure_url'],
            webp_url=result['webp_url'],
            file_size_kb=round(result['bytes'] / 1024),
            width=result['width'],
            height=result['height'],
        )

        serializer = MarketingImageSerializer(img)
        return Response({
            'success': True,
            'message': f'Image "{image_name}" uploaded successfully as WebP!',
            'image': serializer.data,
            'remaining_slots': MAX_IMAGES_PER_CLIENT - (existing_count + 1),
        }, status=status.HTTP_201_CREATED)


class MarketingImageDetailView(views.APIView):
    """
    View or delete a single marketing image.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        """Get details of a single image."""
        client = _get_client(request.user)
        try:
            img = MarketingImage.objects.get(pk=pk, client=client)
        except MarketingImage.DoesNotExist:
            return Response({'error': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(MarketingImageSerializer(img).data)

    def delete(self, request, pk):
        """Delete image from Cloudinary and DB."""
        client = _get_client(request.user)
        try:
            img = MarketingImage.objects.get(pk=pk, client=client)
        except MarketingImage.DoesNotExist:
            return Response({'error': 'Image not found.'}, status=status.HTTP_404_NOT_FOUND)

        image_name = img.name
        public_id = img.cloudinary_public_id

        # Delete from Cloudinary
        _delete_from_cloudinary(public_id)

        # Delete from DB
        img.delete()

        return Response({
            'success': True,
            'message': f'Image "{image_name}" deleted successfully.',
        })
