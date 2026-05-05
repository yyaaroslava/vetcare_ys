from django.contrib import admin
from .models import Appointment

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    """
    Адмін-панель для керування записами на прийом.
    Дозволяє фільтрувати за статусом та датою.
    """
    list_display = ['animal', 'client', 'vet', 'date', 'time', 'status']
    list_filter = ['status', 'date']
    search_fields = ['animal__name', 'client__email']
