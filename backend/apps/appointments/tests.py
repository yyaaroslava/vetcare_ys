from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Appointment
from apps.accounts.models import User
from apps.animals.models import Animal
from datetime import date, time, timedelta

class AppointmentTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email='client@test.com', password='pw', role='client')
        self.vet = User.objects.create_user(email='vet@test.com', password='pw', role='doctor', is_staff=True)
        self.animal = Animal.objects.create(name='Rex', species=None, owner=self.owner, birth_date=date(2020, 1, 1))
        self.api = APIClient()

    def test_free_slots_for_vet(self):
        """TC-06: Вибір вільного слоту працює"""
        self.api.force_authenticate(user=self.owner)
        future_date = (date.today() + timedelta(days=7)).isoformat()
        response = self.api.get(f'/api/appointments/free-slots/?vet={self.vet.id}&date={future_date}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_appointment_via_api(self):
        """TC-07: Створення запису працює"""
        self.api.force_authenticate(user=self.owner)
        future_date = (date.today() + timedelta(days=7)).isoformat()
        data = {
            'vet': self.vet.id, 'animal': self.animal.id,
            'date': future_date, 'time': '10:00', 'description': 'Checkup'
        }
        response = self.api.post('/api/appointments/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_cancel_appointment_changes_status(self):
        """TC-08: Перевірка зміни статусу при скасуванні запису"""
        appointment = Appointment.objects.create(
            animal=self.animal, client=self.owner, vet=self.vet,
            date=date.today() + timedelta(days=1), time=time(10, 0),
        )
        self.api.force_authenticate(user=self.owner)
        response = self.api.post(f'/api/appointments/{appointment.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        # Очікуємо cancelled, але залишиться pending (баг)
        self.assertEqual(appointment.status, 'cancelled')

    def test_vet_view_own_schedule(self):
        """TC-09: Розклад лікаря відображається вірно"""
        self.api.force_authenticate(user=self.vet)
        response = self.api.get('/api/appointments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
