from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_superuser or 
            request.user.is_staff or 
            request.user.role == 'admin'
        )


class IsVetOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or 
            request.user.is_superuser or 
            request.user.role in ['doctor', 'admin']
        )


class IsOwnerOrVetOrAdmin(BasePermission):
    """Перевірка на рівні об'єкта: власник може працювати зі своїми записами, лікарі та адміни мають повний доступ"""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if (request.user.is_staff or 
            request.user.is_superuser or 
            request.user.role in ['doctor', 'admin']):
            return True
        # Для тварин, записів тощо, що мають поле 'owner'
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'client'):
            return obj.client == request.user
        return False
