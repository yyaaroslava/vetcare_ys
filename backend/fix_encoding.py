import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.accounts.models import User

def fix_users():
    # Fix Doctor
    try:
        doc = User.objects.get(email='doctor@vetcare.ua')
        doc.first_name = 'Олександр'
        doc.last_name = 'Петренко'
        doc.save()
        print('Doctor names fixed (UTF-8)')
    except User.DoesNotExist:
        print('Doctor not found')

    # Fix Admin
    admin = User.objects.filter(email='admin@vetcare.ua').first()
    if admin:
        admin.first_name = 'Адмін'
        admin.last_name = 'Системи'
        admin.set_password('adminpassword') # Reset password to be sure
        admin.is_superuser = True
        admin.is_staff = True
        admin.save()
        print('Admin updated and password reset to "adminpassword"')
    else:
        User.objects.create_superuser(
            email='admin@vetcare.ua',
            username='admin',
            password='adminpassword',
            first_name='Адмін',
            last_name='Системи'
        )
        print('Admin created with password "adminpassword"')

if __name__ == '__main__':
    fix_users()
