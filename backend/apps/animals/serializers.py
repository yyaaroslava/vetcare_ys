from rest_framework import serializers
from .models import Animal, Species, Breed, Color


"""
Серіалізатори для перетворення об'єктів тварин у JSON та навпаки.
Включають логіку автоматичного створення пов'язаних записів (види, породи).
"""

class AutoCreateRelatedField(serializers.CharField):
    def to_representation(self, value):
        if not value: return ''
        return value.name

class AnimalSerializer(serializers.ModelSerializer):
    """Основний серіалізатор для тварин, що включає дані про власника та вік"""
    owner_name = serializers.SerializerMethodField()
    owner_phone = serializers.SerializerMethodField()
    owner_email = serializers.SerializerMethodField()
    age = serializers.ReadOnlyField()
    species_display = serializers.SerializerMethodField()
    
    species = AutoCreateRelatedField()
    breed = AutoCreateRelatedField(required=False, allow_blank=True, allow_null=True)
    color = AutoCreateRelatedField(required=False, allow_blank=True, allow_null=True)
    vet_display = serializers.SerializerMethodField()

    class Meta:
        model = Animal
        fields = [
            'id', 'owner', 'owner_name', 'owner_phone', 'owner_email',
            'name', 'species', 'species_display', 'breed', 'gender',
            'birth_date', 'weight', 'color', 'vet', 'vet_display',
            'allergies', 'chronic_diseases', 'notes',
            'age', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {'owner': {'required': False}}

    def get_owner_name(self, obj): return obj.owner.get_full_name()
    def get_owner_phone(self, obj): return obj.owner.phone or ''
    def get_owner_email(self, obj): return obj.owner.email or ''
    
    def get_species_display(self, obj): 
        if obj.species:
            return obj.species.name_uk or obj.species.name
        return ''

    def get_vet_display(self, obj):
        if obj.vet:
            return obj.vet.get_full_name()
        return ''

    def validate_name(self, value):
        if value.isdigit():
            raise serializers.ValidationError("Кличка не може складатися лише з цифр.")
        if len(value) < 2:
            raise serializers.ValidationError("Кличка занадто коротка.")
        return value

    def validate_breed(self, value):
        if value and value.isdigit():
            raise serializers.ValidationError("Назва породи не може складатися лише з цифр.")
        return value

    def validate_color(self, value):
        if value and value.isdigit():
            raise serializers.ValidationError("Колір не може складатися лише з цифр.")
        return value

    def validate_birth_date(self, value):
        if value:
            from datetime import date
            if value > date.today():
                raise serializers.ValidationError("Дата народження не може бути в майбутньому.")
        return value

    def validate_owner(self, value):
        request = self.context.get('request')
        if request and request.user.role == 'client':
            if value != request.user:
                raise serializers.ValidationError("Ви можете додавати тварин лише собі.")
        return value

    def create(self, validated_data):
        """Створення тварини з автоматичним пошуком або створенням виду та породи"""
        species_name = validated_data.pop('species', None)
        breed_name = validated_data.pop('breed', None)
        color_name = validated_data.pop('color', None)
        
        if species_name:
            # Мапінг для автоматичного заповнення українських назв
            names_map = {
                'dog': 'Собака', 'cat': 'Кіт', 'bird': 'Птах', 
                'rabbit': 'Кролик', 'horse': 'Кінь', 'hamster': 'Хом\'як'
            }
            name_uk = names_map.get(species_name, '')
            
            species_obj, _ = Species.objects.get_or_create(
                name=species_name, 
                defaults={'name_uk': name_uk}
            )
            validated_data['species'] = species_obj
            
        if breed_name and species_name:
            species_obj = validated_data.get('species')
            breed_obj, _ = Breed.objects.get_or_create(name=breed_name, species=species_obj)
            validated_data['breed'] = breed_obj
            
        if color_name:
            color_obj, _ = Color.objects.get_or_create(name=color_name)
            validated_data['color'] = color_obj
            
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Оновлення даних тварини з підтримкою динамічної зміни виду/породи"""
        species_name = validated_data.pop('species', None)
        breed_name = validated_data.pop('breed', None)
        color_name = validated_data.pop('color', None)
        
        if species_name is not None:
            species_obj, _ = Species.objects.get_or_create(name=species_name)
            instance.species = species_obj
            
        if breed_name is not None:
            if breed_name == '':
                instance.breed = None
            else:
                breed_obj, _ = Breed.objects.get_or_create(name=breed_name, species=instance.species)
                instance.breed = breed_obj
                
        if color_name is not None:
            if color_name == '':
                instance.color = None
            else:
                color_obj, _ = Color.objects.get_or_create(name=color_name)
                instance.color = color_obj
                
        return super().update(instance, validated_data)
