from django.core.management.base import BaseCommand
from apps.accounts.models import User

class Command(BaseCommand):
    help = 'Creates default admin and doctor for demo purposes'

    def handle(self, *args, **options):
        # Створення Адміна
        admin_email = 'admin@vetcare.ua'
        if not User.objects.filter(email=admin_email).exists():
            User.objects.create_superuser(
                email=admin_email,
                password='AdminPass123!',
                first_name='Головний',
                last_name='Адміністратор',
                role='admin'
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created admin: {admin_email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin {admin_email} already exists'))

        # Створення Лікаря
        doctor_email = 'doctor@vetcare.ua'
        if not User.objects.filter(email=doctor_email).exists():
            User.objects.create_user(
                email=doctor_email,
                password='DoctorPass123!',
                first_name='Іван',
                last_name='Петренко',
                role='doctor',
                is_staff=True
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created doctor: {doctor_email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Doctor {doctor_email} already exists'))

        # Створення Клієнта
        client_email = 'client@vetcare.ua'
        if not User.objects.filter(email=client_email).exists():
            User.objects.create_user(
                email=client_email,
                password='ClientPass123!',
                first_name='Тетяна',
                last_name='Ковальчук',
                role='client'
            )
            self.stdout.write(self.style.SUCCESS(f'Successfully created client: {client_email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Client {client_email} already exists'))
