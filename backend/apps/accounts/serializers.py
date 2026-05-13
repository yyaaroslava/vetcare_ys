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

# Обробка та валідація номера телефону у форматі +380XXXXXXXXX
def validate_ua_phone(value):
    if not value:
        return value
    cleaned = re.sub(r'[\s()\-]', '', value)
    
    # Сувора перевірка довжини: префікс +380 (4 символи) + 9 цифр = 13 символів
    if len(cleaned) != 13 or not re.match(r'^\+380\d{9}$', cleaned):
        raise serializers.ValidationError(
            "Невірний формат. Коректний: +380XXXXXXXXX (рівно 9 цифр після +380)"
        )
    return cleaned

# Основний серіалізатор користувача: керує даними профілю, паролями та ролями
class UserSerializer(serializers.ModelSerializer):
    # Пароль доступний тільки для запису, щоб не передавати його у відповідях API
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'phone', 'password', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_first_name(self, value):
        return validate_name_field(value, "Ім'я")

    def validate_last_name(self, value):
        return validate_name_field(value, "Прізвище")

    def validate_phone(self, value):
        return validate_ua_phone(value)

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        role = validated_data.get('role', 'client')
        
        # Автоматично ставимо is_staff для лікарів та адмінів для сумісності з Django
        is_staff = role in ['doctor', 'admin']
        
        base_username = validated_data['email'].split('@')[0]
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        user = User.objects.create_user(username=username, is_staff=is_staff, **validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        role = validated_data.get('role')
        
        if role is not None:
            instance.is_staff = role in ['doctor', 'admin']
            
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

# Серіалізатор для реєстрації: включає обов'язкове підтвердження пароля та телефону
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=True, max_length=13) # Телефон тепер обов'язкове поле

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
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Паролі не співпадають'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        
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
