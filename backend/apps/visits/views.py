from rest_framework import generics
from .models import Visit
from .serializers import VisitSerializer

# В'ю для отримання списку візитів та створення нових записів
class VisitListCreateView(generics.ListCreateAPIView):
    serializer_class = VisitSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Visit.objects.select_related('appointment', 'appointment__animal', 'appointment__vet', 'appointment__animal__owner')
        
        if user.role == 'doctor':
            qs = qs.filter(appointment__vet=user)
        elif not (user.is_superuser or user.role == 'admin'):
            qs = qs.filter(appointment__animal__owner=user)
            
        animal_id = self.request.query_params.get('animal')
        if animal_id:
            qs = qs.filter(appointment__animal_id=animal_id)
        return qs

class VisitDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = VisitSerializer
    queryset = Visit.objects.select_related('appointment', 'appointment__animal', 'appointment__vet')
