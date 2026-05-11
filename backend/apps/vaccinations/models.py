from django.db import models
from apps.animals.models import Animal
from apps.accounts.models import User

class Vaccination(models.Model):
    """
    Модель для обліку вакцинацій тварин.
    Зберігає інформацію про назву вакцини, дату проведення, статус та планову наступну дату.
    """
    STATUS_DONE = 'done'
    STATUS_PLANNED = 'planned'
    STATUS_OVERDUE = 'overdue'
    STATUS_CHOICES = [
        (STATUS_DONE, 'Виконано'),
        (STATUS_PLANNED, 'Заплановано'),
        (STATUS_OVERDUE, 'Прострочено'),
    ]

    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='vaccinations')
    vet = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='vaccinations_given', limit_choices_to={'is_staff': True, 'is_superuser': False})
    vaccine_name = models.CharField(max_length=200, verbose_name='Назва вакцини')
    vaccine_type = models.CharField(max_length=200, blank=True, verbose_name='Тип вакцини')
    date_given = models.DateField(verbose_name='Дата проведення')
    next_date = models.DateField(null=True, blank=True, verbose_name='Наступна дата')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_DONE)
    batch_number = models.CharField(max_length=100, blank=True, verbose_name='Серія препарату')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Вакцинація'
        verbose_name_plural = 'Вакцинації'
        ordering = ['-date_given']

    def __str__(self):
        return f"{self.animal.name} — {self.vaccine_name} ({self.date_given})"