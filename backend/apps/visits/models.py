from django.db import models
from apps.appointments.models import Appointment

class Visit(models.Model):
    """
    Модель для зберігання результатів медичного візиту (прийому).
    Містить діагноз, призначення, а також клінічні показники тварини на момент огляду.
    """
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='visit')
    diagnosis = models.TextField(verbose_name='Діагноз / Опис')
    prescription = models.TextField(blank=True, verbose_name='Призначення')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Візит'
        verbose_name_plural = 'Візити'
        ordering = ['-appointment__date', '-created_at']

    def __str__(self):
        return f"{self.appointment.animal.name} — {self.appointment.date} ({self.appointment.vet.get_full_name()})"
