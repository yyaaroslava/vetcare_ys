from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

# Реєстрація користувача в адмінці. Додано роль та телефон у список полів.
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    
    # Відображення додаткових полів у формі редагування
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role', 'phone')}),
    )
    
    # Поля, які видно у списку користувачів
    list_display = ['username', 'email', 'role', 'is_staff']
    list_filter = ['role', 'is_staff']
