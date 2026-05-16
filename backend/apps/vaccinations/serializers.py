from rest_framework import serializers
from .models import Vaccination

class VaccinationSerializer(serializers.ModelSerializer):
    """
    Серіалізатор для медичних записів про вакцинацію.
    Забезпечує представлення даних для фронтенду, включаючи назви тварин та лікарів.
    """
    animal_name = serializers.SerializerMethodField()
    animal_species = serializers.SerializerMethodField()
    vet_name = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = Vaccination
        fields = [
            'id', 'animal', 'animal_name', 'animal_species', 'vet', 'vet_name', 'owner_name',
            'vaccine_name', 'date_given', 'next_date',
            'status', 'status_display', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_animal_name(self, obj): 
        return obj.animal.name if obj.animal else "—"
    
    def get_animal_species(self, obj): 
        if not obj.animal or not obj.animal.species:
            return None
        return obj.animal.species.name
    
    def get_vet_name(self, obj): 
        return obj.vet.get_full_name() if obj.vet else "—"
    
    def get_owner_name(self, obj):
        return obj.animal.owner.get_full_name() if obj.animal and obj.animal.owner else "—"
    
    def get_status_display(self, obj): 
        return obj.get_status_display() if obj else ""