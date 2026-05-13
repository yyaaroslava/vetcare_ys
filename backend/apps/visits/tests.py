from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Visit
from apps.accounts.models import User
from apps.animals.models import Animal
from apps.appointments.models import Appointment
from datetime import date, time

class VisitTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email='client@test.com', password='pw', role='client',
            first_name='Клієнт', last_name='Тестовий'
        )
        self.vet = User.objects.create_user(
            email='vet@test.com', password='pw', role='doctor',
            first_name='Лікар', last_name='Тестовий'
        )
        self.vet.is_staff = True
        self.vet.save()
        self.animal = Animal.objects.create(
            name='Rex', species=None, owner=self.owner, birth_date=date(2020, 1, 1)
        )
        self.appointment = Appointment.objects.create(
            animal=self.animal, client=self.owner, vet=self.vet,
            date=date.today(), time=time(10, 0), status='confirmed'
        )
        self.api = APIClient()

    def test_visit_creation_model(self):
        """Позитивний тест: створення візиту через модель"""
        visit = Visit.objects.create(
            appointment=self.appointment,
            diagnosis='Здоровий'
        )
        self.assertEqual(Visit.objects.count(), 1)

    # --- TC-10: Заповнення протоколу візиту ---

    def test_vet_fill_visit_protocol(self):
        """
        TC-10: Заповнення протоколу візиту ветеринаром.
        Перевірка: лікар створює запис з діагнозом та призначенням через API.
        """
        self.api.force_authenticate(user=self.vet)
        data = {
            'appointment': self.appointment.id,
            'diagnosis': 'Отит зовнішнього вуха',
            'prescription': 'Краплі Софрадекс 2 рази на день, 7 днів',
            'weight_at_visit': 12.5,
            'temperature': 38.5
        }
        response = self.api.post('/api/visits/', data)
        self.assertIn(response.status_code, [
            status.HTTP_201_CREATED, status.HTTP_200_OK
        ])
        self.assertEqual(Visit.objects.count(), 1)
        visit = Visit.objects.first()
        self.assertEqual(visit.diagnosis, 'Отит зовнішнього вуха')
        self.assertEqual(visit.prescription, 'Краплі Софрадекс 2 рази на день, 7 днів')

    def test_visit_appears_in_animal_history(self):
        """
        TC-10 (додатковий): Візит з'являється в історії тварини.
        Перевірка: після створення візиту він доступний через фільтр по тварині.
        """
        Visit.objects.create(
            appointment=self.appointment,
            diagnosis='Планова перевірка',
            prescription='Без призначень'
        )
        self.api.force_authenticate(user=self.owner)
        response = self.api.get(f'/api/visits/?animal={self.animal.id}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data if isinstance(response.data, list) else response.data.get('results', response.data)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['diagnosis'], 'Планова перевірка')
