# api/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("menu/weekly/", views.WeeklyMenuView.as_view(), name="weekly-menu"),
    path("user/me/", views.UserDetailView.as_view(), name="user-detail"),
    path("cook/dashboard/", views.CookDashboardView.as_view(), name="cook-dashboard"),
    path("cook/issue-meal/", views.IssueMealView.as_view(), name="issue-meal"),
    path("cook/purchase-requests/", views.CreatePurchaseRequestView.as_view(), name="create-purchase-request"),
    path("pay-meal/", views.PayMealView.as_view(), name="pay-meal"),
    path("buy-subscription/", views.BuySubscriptionView.as_view(), name="buy-subscription"),
    path("paid-students/", views.PaidStudentsView.as_view(), name="paid-students"),
    path("issue-meal-for-user/", views.IssueMealForUserView.as_view()),
    path("cook/issue-meal-for-user/", views.IssueMealForUserView.as_view(), name="issue-meal-for-user"),
    path("admin/stats/", views.AdminStatsView.as_view(), name="admin-stats"),
    path("admin/purchase-requests/", views.AdminPurchaseRequestsView.as_view(), name="admin-purchase-requests"),
    path("admin/approve-request/<int:pk>/", views.ApprovePurchaseRequestView.as_view(), name="approve-purchase-request"),
    path("admin/reports/daily/", views.DailyReportView.as_view(), name="daily-report"),
    path("reviews/", views.CreateReviewView.as_view(), name="create-review"),
    path("user/reviews/", views.UserReviewsView.as_view(), name="user-reviews"),
]