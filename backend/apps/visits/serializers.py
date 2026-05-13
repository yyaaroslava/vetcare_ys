from rest_framework import serializers
from .models import Visit

"""
Серіалізатор для медичних візитів.
Додає розширену інформацію про тварину, власника та час прийому для зручного відображення на фронтенді.
"""
class VisitSerializer(serializers.ModelSerializer):
    animal = serializers.ReadOnlyField(source='appointment.animal.id')
    animal_name = serializers.ReadOnlyField(source='appointment.animal.name')
    vet = serializers.ReadOnlyField(source='appointment.vet.id')
    vet_name = serializers.SerializerMethodField(read_only=True)
    owner_name = serializers.SerializerMethodField(read_only=True)
    status_display = serializers.SerializerMethodField(read_only=True)
    visit_date = serializers.ReadOnlyField(source='appointment.date', read_only=True)
    visit_time = serializers.TimeField(source='appointment.time', format='%H:%M', read_only=True)
    visit_end_time = serializers.SerializerMethodField(read_only=True)
    status = serializers.ReadOnlyField(source='appointment.status', read_only=True)

    class Meta:
        model = Visit
        fields = [
            'id', 'animal', 'animal_name', 'vet', 'vet_name', 'owner_name',
            'appointment', 'visit_date', 'visit_time', 'visit_end_time', 'diagnosis', 'prescription',
            'status', 'status_display', 'weight_at_visit', 'temperature',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'animal', 'animal_name', 'vet', 'vet_name', 'owner_name', 'visit_date', 'visit_time', 'visit_end_time', 'status', 'status_display', 'created_at', 'updated_at']

    def get_vet_name(self, obj): return obj.appointment.vet.get_full_name()
    def get_owner_name(self, obj): return obj.appointment.animal.owner.get_full_name()
    def get_status_display(self, obj): return obj.appointment.get_status_display()
    def get_visit_end_time(self, obj):
        if obj.appointment and obj.appointment.time:
            return obj.appointment.get_end_time().strftime('%H:%M')
        return None

    def validate_weight_at_visit(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError("Вага не може бути від'ємною.")
        return value
