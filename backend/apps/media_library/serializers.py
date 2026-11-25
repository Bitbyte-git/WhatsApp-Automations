from rest_framework import serializers
from .models import MarketingImage


class MarketingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketingImage
        fields = [
            'id', 'name', 'cloudinary_public_id',
            'cloudinary_url', 'webp_url',
            'file_size_kb', 'width', 'height',
            'created_at'
        ]
        read_only_fields = [
            'id', 'cloudinary_public_id',
            'cloudinary_url', 'webp_url',
            'file_size_kb', 'width', 'height',
            'created_at'
        ]
