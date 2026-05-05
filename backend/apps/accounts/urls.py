from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, LoginView, LogoutView, MeView, VetListView, ClientListView, UserViewSet

router = DefaultRouter()
router.register('users', UserViewSet, basename='users')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('vets/', VetListView.as_view(), name='vet_list'),
    path('clients/', ClientListView.as_view(), name='client_list'),
]
