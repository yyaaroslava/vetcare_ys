from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Animal
from apps.accounts.models import User
from datetime import date

class AnimalTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email='owner@test.com', password='pw', role='client',
            first_name='Марія', last_name='Коваль'
        )
        self.client.force_authenticate(user=self.owner)
        self.url = '/api/animals/'

    def test_view_own_animals(self):
        """TC-03: Перегляд списку тварин працює"""
        Animal.objects.create(name='Рекс', species=None, owner=self.owner, birth_date=date(2020, 1, 1))
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_animal_valid(self):
        """TC-04: Додавання тварини працює"""
        data = {'name': 'Рекс-Мілорд', 'species': 'dog', 'weight': 10.5}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_weight_negative(self):
        """TC-05: Перевірка валідації ваги тварини"""
        data = {'name': 'Барсік', 'species': 'cat', 'weight': -5.0}
        response = self.client.post(self.url, data)
        # Очікуємо 400, але поверне 201 (баг)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
