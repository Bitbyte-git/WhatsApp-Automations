from django.db import models
from apps.core.models import TimeStampedModel


class MarketingImage(TimeStampedModel):
    """
    Marketing images uploaded to Cloudinary for WhatsApp broadcast campaigns.
    Max 3 images per client. Always stored as WebP via Cloudinary transformation.
    """
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='marketing_images',
        db_index=True
    )
    name = models.CharField(max_length=255, help_text="Friendly display name for this image")
    cloudinary_public_id = models.CharField(max_length=512, unique=True)
    cloudinary_url = models.URLField(max_length=1024, help_text="Original Cloudinary CDN URL")
    webp_url = models.URLField(max_length=1024, blank=True, help_text="WebP transformed CDN URL")
    file_size_kb = models.PositiveIntegerField(default=0)
    width = models.PositiveIntegerField(default=0)
    height = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'created_at']),
        ]

    def __str__(self):
        return f"{self.name} ({self.client.name})"
