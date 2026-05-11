from django.urls import path
from . import views

urlpatterns = [
    path('', views.VaccinationListCreateView.as_view(), name='vaccination-list'),
    path('<int:pk>/', views.VaccinationDetailView.as_view(), name='vaccination-detail'),
]
