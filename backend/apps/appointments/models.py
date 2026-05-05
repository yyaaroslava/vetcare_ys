from django.db import models
from apps.accounts.models import User
from apps.animals.models import Animal


"""
Модель запису на прийом до ветеринара.
Зберігає дані про клієнта, тварину, лікаря, дату та статус.
"""

class Appointment(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Очікується'),
        (STATUS_CONFIRMED, 'Підтверджено'),
        (STATUS_COMPLETED, 'Завершено'),
        (STATUS_CANCELLED, 'Скасовано'),
    ]

    DURATION_CHOICES = [
        (30, '30 хвилин'),
        (60, '1 година'),
        (90, '1.5 години'),
        (120, '2 години'),
    ]

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments', limit_choices_to={'is_staff': False, 'is_superuser': False})
    vet = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vet_appointments', limit_choices_to={'is_staff': True, 'is_superuser': False})
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField(verbose_name='Дата')
    time = models.TimeField(verbose_name='Час')
    duration = models.IntegerField(choices=DURATION_CHOICES, default=60, verbose_name='Тривалість (хв)')
    description = models.TextField(blank=True, verbose_name='Опис проблеми')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    notes = models.TextField(blank=True, verbose_name='Нотатки лікаря')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Прийом'
        verbose_name_plural = 'Прийоми'
        ordering = ['date', 'time']

    def __str__(self):
        return f"{self.animal.name} — {self.date} {self.time} ({self.vet.get_full_name()})"

    def get_end_time(self):
        """Розрахунок часу завершення прийому на основі тривалості"""
        from datetime import datetime, timedelta
        dt = datetime.combine(self.date, self.time)
        return (dt + timedelta(minutes=self.duration)).time()
