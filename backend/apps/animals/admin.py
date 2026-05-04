from django.contrib import admin
from .models import Animal

@admin.register(Animal)
class AnimalAdmin(admin.ModelAdmin):
    """
    Налаштування адміністративної панелі для керування тваринами.
    Дозволяє фільтрувати, шукати та переглядати основні дані пацієнтів.
    """
    list_display = ['name', 'species', 'breed', 'owner', 'weight', 'created_at']
    list_filter = ['species']
    search_fields = ['name', 'owner__email', 'owner__first_name']
    raw_id_fields = ['owner']
