import re
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User

# Перевірка текстових полів на відповідність вимогам (довжина, відсутність цифр)
def validate_name_field(value, field_name):
    if len(value) < 2:
        raise serializers.ValidationError(f"{field_name}: Мін. довжина 2 символи")
    if any(char.isdigit() for char in value):
        raise serializers.ValidationError(f"{field_name}: Цифри недозволені")
    return value

# Обробка та валідація номера телефону
def validate_ua_phone(value):
    if not value:
        return value
    # Очищення від пробілів та дефісів для збереження в єдиному форматі
    return value.replace(' ', '').replace('-', '')

# Основний серіалізатор користувача
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'phone', 'created_at']
        read_only_fields = ['id', 'created_at', 'role']

# Серіалізатор для процесу реєстрації
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password2', 'phone']

    def validate_first_name(self, value):
        return validate_name_field(value, "Ім'я")

    def validate_last_name(self, value):
        return validate_name_field(value, "Прізвище")

    def validate_phone(self, value):
        return validate_ua_phone(value)

    def validate(self, data):
        # Перевірка збігу пароля та підтвердження
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Паролі не співпадають'})
        return data

    def create(self, validated_data):
        # Видалення допоміжних полів перед створенням запису
        validated_data.pop('password2')
        password = validated_data.pop('password')
        
        # Генерація username на основі поштової адреси
        base_username = validated_data['email'].split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        user = User.objects.create_user(
            email=validated_data['email'],
            username=username,
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', '')
        )
        return user
