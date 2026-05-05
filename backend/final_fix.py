import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.accounts.models import User

def final_fix():
    # Force UTF-8 names and Reset Admin
    users_data = [
        {
            'email': 'doctor@vetcare.ua',
            'first_name': u'\u041e\u043b\u0435\u043a\u0441\u0430\u043d\u0434\u0440', # Олександр
            'last_name': u'\u041f\u0435\u0442\u0440\u0435\u043d\u043a\u043e',    # Петренко
        },
        {
            'email': 'admin@vetcare.ua',
            'first_name': u'\u0410\u0434\u043c\u0456\u043d',                   # Адмін
            'last_name': u'\u0421\u0438\u0441\u0442\u0435\u043c\u0438',         # Системи
            'is_superuser': True,
            'is_staff': True,
            'password': 'adminpassword'
        }
    ]

    for data in users_data:
        user, created = User.objects.get_or_create(email=data['email'], defaults={'username': data['email'].split('@')[0]})
        user.first_name = data['first_name']
        user.last_name = data['last_name']
        if 'is_superuser' in data:
            user.is_superuser = data['is_superuser']
            user.is_staff = data['is_staff']
        if 'password' in data:
            user.set_password(data['password'])
        user.save()
        print(f"User {data['email']} updated successfully.")

if __name__ == '__main__':
    final_fix()
