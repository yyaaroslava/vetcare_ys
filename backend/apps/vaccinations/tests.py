from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Vaccination
from apps.accounts.models import User
from apps.animals.models import Animal
from datetime import date

class VaccinationTests(TestCase):
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
        self.api = APIClient()

    def test_vaccination_creation_model(self):
        """Позитивний тест: створення вакцинації через модель"""
        vac = Vaccination.objects.create(
            animal=self.animal,
            vaccine_name='Rabies',
            date_given=date.today(),
            status='planned'
        )
        self.assertEqual(Vaccination.objects.count(), 1)

    # --- TC-11: Реєстрація вакцинації ---

    def test_vet_create_vaccination_via_api(self):
        """
        TC-11: Реєстрація вакцинації ветеринаром.
        Перевірка: лікар може створити запис про вакцинацію через API.
        """
        self.api.force_authenticate(user=self.vet)
        data = {
            'animal': self.animal.id,
            'vaccine_name': 'Нобівак DHPPi',
            'status': 'done',
            'date_given': str(date.today()),
        }
        response = self.api.post('/api/vaccinations/', data)
        self.assertIn(response.status_code, [
            status.HTTP_201_CREATED, status.HTTP_200_OK
        ])

    def test_vaccination_appears_in_animal_history(self):
        """
        TC-11 (додатковий): Запис про вакцинацію з'являється в історії тварини.
        """
        Vaccination.objects.create(
            animal=self.animal,
            vaccine_name='Нобівак Rabies',
            date_given=date.today(),
            status='done'
        )
        self.assertEqual(
            self.animal.vaccinations.count(), 1
        )
        self.assertEqual(
            self.animal.vaccinations.first().vaccine_name, 'Нобівак Rabies'
        )
