from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User

class AccountTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('auth_register')
        self.login_url = reverse('auth_login')

    # --- TC-01: Реєстрація нового користувача ---

    def test_valid_registration(self):
        """TC-01: Реєстрація з валідними даними (a@b.ua, Ян)"""
        data = {
            'email': 'a@b.ua',
            'password': 'Pass123!',
            'password2': 'Pass123!',
            'first_name': 'Ян',
            'last_name': 'Тестовий',
            'phone': '+380671234567'
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_phone_validation_too_long(self):
        """TC-01: Перевірка валідації довжини номера телефону"""
        data = {
            'email': 'phone_bug@test.com',
            'password': 'Pass123!',
            'password2': 'Pass123!',
            'first_name': 'Ян',
            'last_name': 'Тестовий',
            'phone': '+38067123456789'
        }
        response = self.client.post(self.register_url, data)
        # Очікуємо 400 (помилка), але система поверне 201 (баг)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- TC-02: Авторизація ---

    def test_login_valid(self):
        """TC-02: Авторизація працює коректно"""
        User.objects.create_user(email='user@test.com', password='Pass123!', role='client')
        response = self.client.post(self.login_url, {'email': 'user@test.com', 'password': 'Pass123!'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    # --- TC-12 & TC-13 ---

    def test_admin_view_users(self):
        """TC-12: Перегляд списку користувачів адміном (API працює)"""
        admin = User.objects.create_user(email='admin@test.com', password='pw', role='admin', is_staff=True)
        self.client.force_authenticate(user=admin)
        response = self.client.get('/api/accounts/users/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_change_role(self):
        """TC-13: Адмін може змінювати ролі"""
        admin = User.objects.create_user(email='admin_role@test.com', password='pw', role='admin', is_staff=True)
        user = User.objects.create_user(email='target_user@test.com', password='pw', role='client')
        self.client.force_authenticate(user=admin)
        response = self.client.patch(f'/api/accounts/users/{user.id}/', {'role': 'doctor'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
