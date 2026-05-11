from rest_framework import generics, permissions
from .models import Vaccination
from .serializers import VaccinationSerializer

class VaccinationListCreateView(generics.ListCreateAPIView):
    """
    Ендпоінт для отримання списку вакцинацій та додавання нових записів.
    Включає фільтрацію за твариною та правами доступу користувача.
    """
    serializer_class = VaccinationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Vaccination.objects.all().select_related('animal', 'vet')
        
        if not user.is_staff and not user.is_superuser:
            # Тільки свої для клієнтів
            qs = qs.filter(animal__owner=user)
            
        return qs

    def perform_create(self, serializer):
        # Якщо лікар створює запис, встановлюємо його як виконавця
        vet = self.request.user if (self.request.user.role == 'doctor') else None
        serializer.save(vet=vet)

class VaccinationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Ендпоінт для перегляду, оновлення або видалення конкретного запису про вакцинацію.
    """
    serializer_class = VaccinationSerializer
    queryset = Vaccination.objects.select_related('animal', 'vet')
    permission_classes = [permissions.IsAuthenticated]