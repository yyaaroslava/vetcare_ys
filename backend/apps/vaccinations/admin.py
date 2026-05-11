from django.contrib import admin
from .models import Vaccination

@admin.register(Vaccination)
class VaccinationAdmin(admin.ModelAdmin):
    """
    Налаштування відображення вакцинацій у панелі адміністратора.
    """
    list_display = ['animal', 'vaccine_name', 'date_given', 'next_date', 'status', 'vet']
    list_filter = ['status', 'date_given']
    search_fields = ['animal__name', 'vaccine_name']
    ordering = ['-date_given']
