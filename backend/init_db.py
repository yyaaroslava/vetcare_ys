import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.accounts.models import User

users = [
    {
        'email': 'admin@vetcare.com',
        'password': 'admin12345',
        'first_name': 'Admin',
        'last_name': 'VetCare',
        'phone': '+380000000000',
        'role': 'admin',
        'is_superuser': True,
        'is_staff': True
    },
    {
        'email': 'vet@vetcare.com',
        'password': 'vet12345',
        'first_name': 'Doctor',
        'last_name': 'House',
        'phone': '+380111111111',
        'role': 'vet',
        'is_staff': True
    },
    {
        'email': 'client@vetcare.com',
        'password': 'client12345',
        'first_name': 'Pet',
        'last_name': 'Owner',
        'phone': '+380222222222',
        'role': 'client'
    }
]

print("Starting DB initialization...", flush=True)

for u_data in users:
    email = u_data.get('email')
    password = u_data.pop('password')
    is_superuser = u_data.pop('is_superuser', False)
    
    user, created = User.objects.get_or_create(email=email, defaults=u_data)
    
    user.set_password(password)
    for key, value in u_data.items():
        setattr(user, key, value)
    if is_superuser:
        user.is_superuser = True
        user.is_staff = True
    user.save()
    
    if created:
        print(f"Created user: {email}", flush=True)
    else:
        print(f"Updated user: {email}", flush=True)

print("DB initialization finished.", flush=True)
