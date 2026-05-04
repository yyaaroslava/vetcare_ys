from rest_framework import generics, permissions, filters
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Animal
from .serializers import AnimalSerializer
from apps.accounts.permissions import IsOwnerOrVetOrAdmin

"""
API-контролери для обробки запитів, пов'язаних з тваринами.
Забезпечують розмежування доступу між власниками та персоналом.
"""

class AnimalListCreateView(generics.ListCreateAPIView):
    """Ендпоінт для отримання списку тварин та створення нових записів"""
    serializer_class = AnimalSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'breed__name', 'owner__first_name', 'owner__last_name']

    def get_queryset(self):
        """Фільтрація списку: клієнти бачать лише своїх тварин, лікарі — усіх"""
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Animal.objects.select_related('owner')
        return Animal.objects.filter(owner=user)

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_staff and not user.is_superuser:
            serializer.save(owner=user)
        else:
            serializer.save()


class AnimalDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Ендпоінт для перегляду, редагування та видалення конкретної тварини за ID"""
    serializer_class = AnimalSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrVetOrAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Animal.objects.select_related('owner')

    def perform_destroy(self, instance):
        """Повне видалення запису про тварину з бази даних"""
        instance.delete()
