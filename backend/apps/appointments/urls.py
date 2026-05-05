from django.urls import path
from . import views

urlpatterns = [
    path('', views.AppointmentListCreateView.as_view(), name='appointment-list'),
    path('<int:pk>/', views.AppointmentDetailView.as_view(), name='appointment-detail'),
    path('<int:pk>/cancel/', views.CancelAppointmentView.as_view(), name='appointment-cancel'),
    path('free-slots/', views.FreeSlotView.as_view(), name='free-slots'),
]
