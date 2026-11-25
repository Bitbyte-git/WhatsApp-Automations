from django.contrib import admin
from .models import MarketingImage

@admin.register(MarketingImage)
class MarketingImageAdmin(admin.ModelAdmin):
    list_display = ['name', 'client', 'file_size_kb', 'width', 'height', 'created_at']
    list_filter = ['client']
    search_fields = ['name', 'client__name']
