from rest_framework import serializers
from datetime import datetime, timedelta
from .models import Appointment

"""
Серіалізатори для записів на прийом.
Включають валідацію робочих годин та перевірку зайнятості лікаря.
"""

class AppointmentSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()
    vet_name = serializers.SerializerMethodField()
    animal_name = serializers.SerializerMethodField()
    animal_species = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    end_time = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id', 'client', 'client_name', 'vet', 'vet_name',
            'animal', 'animal_name', 'animal_species',
            'date', 'time', 'duration', 'end_time',
            'description', 'status', 'status_display',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'client': {'required': False}
        }

    def get_client_name(self, obj): return obj.client.get_full_name()
    def get_vet_name(self, obj): return obj.vet.get_full_name()
    def get_animal_name(self, obj): return obj.animal.name
    def get_animal_species(self, obj):
        if obj.animal.species:
            return obj.animal.species.name_uk or obj.animal.species.name
        return ''
    def get_status_display(self, obj): return obj.get_status_display()
    def get_end_time(self, obj):
        try:
            dt = datetime.combine(obj.date, obj.time)
            end = dt + timedelta(minutes=obj.duration)
            return end.strftime('%H:%M')
        except:
            return None

    def validate(self, data):
        vet = data.get('vet')
        date = data.get('date')
        time = data.get('time')
        duration = data.get('duration', 60)

        # Перевірка робочих годин: запис можливий лише з 08:00 до 17:00
        if time:
            from datetime import time as t
            if time < t(8, 0) or time >= t(17, 0):
                raise serializers.ValidationError(
                    {'time': 'Запис можливий лише з 08:00 до 17:00'}
                )

        # Перевірка перетину часу з існуючими записами лікаря
        if vet and date and time:
            new_start = datetime.combine(date, time)
            new_end = new_start + timedelta(minutes=duration)

            qs = Appointment.objects.filter(
                vet=vet, date=date,
                status__in=['pending', 'confirmed']
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)

            for existing in qs:
                ex_start = datetime.combine(existing.date, existing.time)
                ex_end = ex_start + timedelta(minutes=existing.duration)
                if new_start < ex_end and new_end > ex_start:
                    raise serializers.ValidationError({
                        'time': 'Цей час вже зайнято, оберіть іншу дату або час'
                    })

        # Перевірка, що тварина належить клієнту
        animal = data.get('animal')
        client = data.get('client')
        if animal and client and animal.owner != client:
            raise serializers.ValidationError({'animal': 'Ця тварина не належить вказаному клієнту'})
        return data
