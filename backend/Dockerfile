FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ /app/
EXPOSE 8000
CMD python manage.py migrate && \
    python manage.py shell -c "from apps.accounts.models import User; User.objects.filter(email='admin@vetcare.com').exists() or User.objects.create_superuser('admin@vetcare.com', 'admin12345', first_name='Admin', last_name='VetCare', phone='+380000000000', role='admin')" && \
    python manage.py shell -c "from apps.accounts.models import User; User.objects.filter(email='vet@vetcare.com').exists() or User.objects.create_user('vet@vetcare.com', 'vet12345', first_name='Doctor', last_name='House', phone='+380111111111', role='vet', is_staff=True)" && \
    python manage.py shell -c "from apps.accounts.models import User; User.objects.filter(email='client@vetcare.com').exists() or User.objects.create_user('client@vetcare.com', 'client12345', first_name='Pet', last_name='Owner', phone='+380222222222', role='client')" && \
    gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3
