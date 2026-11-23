from django.urls import path
from apps.analytics.views import (
    OverviewStatsView,
    MessageUsageAnalyticsView,
    RecentActivityView,
)

urlpatterns = [
    path('overview/', OverviewStatsView.as_view(), name='analytics-overview'),
    path('messages/', MessageUsageAnalyticsView.as_view(), name='analytics-messages'),
    path('activity/', RecentActivityView.as_view(), name='analytics-activity'),
]
