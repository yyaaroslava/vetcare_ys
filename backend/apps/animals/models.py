from django.db import models
from apps.accounts.models import User


"""
Моделі для керування базою даних тварин клініки.
Описують структуру видів, порід, кольорів та безпосередньо карток пацієнтів.
"""

class Species(models.Model):
    """Модель для зберігання видів тварин (кіт, собака тощо)"""
    name = models.CharField(max_length=100, unique=True, verbose_name='Назва')
    name_uk = models.CharField(max_length=100, verbose_name='Назва (укр)', blank=True, default='')

    class Meta:
        verbose_name = 'Вид'
        verbose_name_plural = 'Види'

    def __str__(self):
        return self.name_uk or self.name


class Breed(models.Model):
    """Модель для зберігання порід, прив'язаних до конкретних видів"""
    species = models.ForeignKey(Species, on_delete=models.CASCADE, related_name='breeds', verbose_name='Вид')
    name = models.CharField(max_length=100, verbose_name='Назва породи')

    class Meta:
        verbose_name = 'Порода'
        verbose_name_plural = 'Породи'

    def __str__(self):
        return self.name


class Color(models.Model):
    name = models.CharField(max_length=100, verbose_name='Колір')

    class Meta:
        verbose_name = 'Колір'
        verbose_name_plural = 'Кольори'

    def __str__(self):
        return self.name


class Animal(models.Model):
    """Головна модель медичної картки тварини (пацієнта)"""
    GENDER_CHOICES = [('male', 'Самець'), ('female', 'Самиця')]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='animals', limit_choices_to={'is_staff': False, 'is_superuser': False})
    name = models.CharField(max_length=100, verbose_name='Кличка')
    species = models.ForeignKey(Species, on_delete=models.PROTECT, null=True, blank=True, verbose_name='Вид')
    breed = models.ForeignKey(Breed, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Порода')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    birth_date = models.DateField(null=True, blank=True, verbose_name='Дата народження')
    weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name='Вага (кг)')
    color = models.ForeignKey(Color, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Колір')
    allergies = models.TextField(blank=True, verbose_name='Алергії')
    chronic_diseases = models.TextField(blank=True, verbose_name='Хронічні захворювання')
    notes = models.TextField(blank=True, verbose_name='Нотатки')
    vet = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='vet_animals', verbose_name='Лікуючий лікар')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Тварина'
        verbose_name_plural = 'Тварини'
        ordering = ['-created_at']

    def __str__(self):
        species_name = "Невідомо"
        if self.species:
            species_name = self.species.name_uk or self.species.name
        return f"{self.name} ({species_name}) — {self.owner.get_full_name()}"

    @property
    def age(self):
        """Розрахунок віку тварини в роках на основі поточної дати"""
        if not self.birth_date:
            return None
        from datetime import date
        today = date.today()
        years = today.year - self.birth_date.year
        if (today.month, today.day) < (self.birth_date.month, self.birth_date.day):
            years -= 1
        return years
