from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from datetime import datetime, timedelta, time as dtime
from .models import Appointment
from .serializers import AppointmentSerializer
from apps.accounts.permissions import IsOwnerOrVetOrAdmin

"""
API-контролери для керування записами на прийом.
Включають фільтрацію за роллю, скасування та отримання вільних слотів.
"""

class AppointmentListCreateView(generics.ListCreateAPIView):
    """Список записів з фільтрами та створення нового запису"""
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        """
        Фільтрація записів на основі ролі користувача:
        - Адміністратор бачить всі записи клініки.
        - Лікар бачить тільки ті записи, де він призначений ветеринаром.
        - Клієнт бачить тільки своїх власних тварин.
        """
        user = self.request.user
        qs = Appointment.objects.select_related('client', 'vet', 'animal')
        
        # Логіка розподілу прав доступу
        if user.role == 'doctor':
            qs = qs.filter(vet=user)
        elif not (user.is_superuser or user.role == 'admin'):
            qs = qs.filter(client=user)
            
        # Обробка фільтрів з параметрів URL (дата, статус, тварина)
        date = self.request.query_params.get('date')
        if date: qs = qs.filter(date=date)
        status_f = self.request.query_params.get('status')
        if status_f: qs = qs.filter(status=status_f)
        animal_id = self.request.query_params.get('animal')
        if animal_id: qs = qs.filter(animal_id=animal_id)
        
        return qs

    def perform_create(self, serializer):
        """Автоматично прив'язує клієнта при створенні запису"""
        user = self.request.user
        if not user.is_staff and not user.is_superuser:
            serializer.save(client=user)
        else:
            serializer.save()


class AppointmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Деталі, оновлення та видалення конкретного запису"""
    serializer_class = AppointmentSerializer
    permission_classes = [IsOwnerOrVetOrAdmin]

    def get_queryset(self):
        return Appointment.objects.select_related('client', 'vet', 'animal')


class CancelAppointmentView(APIView):
    """Скасування запису клієнтом або персоналом"""
    def post(self, request, pk):
        try:
            appt = Appointment.objects.get(pk=pk)
        except Appointment.DoesNotExist:
            return Response({'detail': 'Не знайдено'}, status=404)
        
        user = request.user
        if not user.is_staff and not user.is_superuser and appt.client != user:
            return Response({'detail': 'Немає доступу'}, status=403)
            
        if appt.status == Appointment.STATUS_COMPLETED:
            return Response({'detail': 'Не можна скасувати завершений прийом'}, status=400)
            
        # Оновлюємо статус на "Скасовано"
        appt.status = Appointment.STATUS_CANCELLED
        appt.save()
        
        return Response(AppointmentSerializer(appt).data)


class FreeSlotView(APIView):
    """Повертає список вільних 30-хвилинних слотів для лікаря на вказану дату"""
    def get(self, request):
        vet_id = request.query_params.get('vet')
        date_str = request.query_params.get('date')
        if not vet_id or not date_str:
            return Response({'error': 'vet and date required'}, status=400)
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date'}, status=400)

        booked = Appointment.objects.filter(
            vet_id=vet_id, date=date,
            status__in=['pending', 'confirmed', 'completed']
        )
        busy = []
        for a in booked:
            start = datetime.combine(date, a.time)
            end = start + timedelta(minutes=a.duration)
            busy.append((start, end))

        slots = []
        now = datetime.now()
        current = datetime.combine(date, dtime(8, 0))
        end_of_day = datetime.combine(date, dtime(17, 0))
        while current < end_of_day:
            slot_end = current + timedelta(minutes=30)
            
            # Слот зайнятий, якщо він перетинається з існуючим записом
            # або якщо дата сьогоднішня і час слоту вже минув
            is_busy = any(
                not (current >= b_end or slot_end <= b_start)
                for b_start, b_end in busy
            )
            
            if date == now.date() and current < now:
                is_busy = True

            slots.append({
                'time': current.strftime('%H:%M'),
                'free': not is_busy
            })
            current = slot_end
        return Response(slots)
