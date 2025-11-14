from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('profile/update/', views.ProfileUpdateView.as_view(), name='profile-update'),

    path('swipe/', views.SwipeView.as_view(), name='swipe'),
    path('matches/', views.MatchListView.as_view(), name='matches'),
    path('potential/', views.PotentialMatchesView.as_view(), name='potential'),

    path('messages/<int:match_id>/', views.MessageListCreateView.as_view(), name='messages'),
    path('verification/', views.VerificationRequestListView.as_view(), name='verification-list'),
    path('verification/<int:req_id>/', views.VerificationRequestUpdateView.as_view(), name='verification-update'),
    path('users/<int:id>/', views.UserDetailView.as_view(), name='user-detail'),
    path('media/<int:user_id>/', views.MediaListCreateView.as_view(), name='media-list-create'),
    path('account/deletion/', views.AccountDeletionScheduleView.as_view(), name='account-deletion'),
]
