from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/animals/', include('apps.animals.urls')),
    path('api/appointments/', include('apps.appointments.urls')),
    path('api/visits/', include('apps.visits.urls')),
    path('api/vaccinations/', include('apps.vaccinations.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
