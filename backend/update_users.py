from apps.accounts.models import User
try:
    doc = User.objects.get(email='doctor@vetcare.ua')
    doc.first_name = 'Олександр'
    doc.last_name = 'Петренко'
    doc.save()
    print('Doctor names updated')
except User.DoesNotExist:
    print('Doctor not found')

admin = User.objects.filter(email='admin@vetcare.ua').first()
if admin:
    admin.first_name = 'Адмін'
    admin.last_name = 'Системи'
    admin.is_superuser = True
    admin.is_staff = True
    admin.save()
    print('Admin updated')
else:
    User.objects.create_superuser(
        email='admin@vetcare.ua',
        username='admin',
        password='adminpassword',
        first_name='Адмін',
        last_name='Системи'
    )
    print('Admin created')
