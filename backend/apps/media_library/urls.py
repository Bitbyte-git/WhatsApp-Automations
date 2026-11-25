from django.urls import path
from .views import MarketingImageUploadView, MarketingImageDetailView

urlpatterns = [
    path('marketing-images/', MarketingImageUploadView.as_view(), name='marketing-image-list-upload'),
    path('marketing-images/<int:pk>/', MarketingImageDetailView.as_view(), name='marketing-image-detail'),
]
