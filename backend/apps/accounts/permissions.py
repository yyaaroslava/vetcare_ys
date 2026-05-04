from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_superuser


class IsVetOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_staff or request.user.is_superuser
        )


class IsOwnerOrVetOrAdmin(BasePermission):
    """Object-level: owner can read/edit their own, vets/admins can access all"""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        # For animals, appointments etc. that have an 'owner' field
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        if hasattr(obj, 'client'):
            return obj.client == request.user
        return False
