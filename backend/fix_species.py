# -*- coding: utf-8 -*-
import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from apps.animals.models import Species

mapping = {
    'dog': 'Собака',
    'cat': 'Кіт',
    'bird': 'Птах',
    'rabbit': 'Кролик',
    'horse': 'Кінь',
    'hamster': "Хом'як",
}

for eng, ukr in mapping.items():
    updated = Species.objects.filter(name=eng, name_uk='').update(name_uk=ukr)
    if updated:
        print(f'  {eng} -> {ukr}')

# Also fix any species that has empty name_uk
for s in Species.objects.filter(name_uk=''):
    print(f'  WARNING: species "{s.name}" has no Ukrainian name!')

print('Done!')
