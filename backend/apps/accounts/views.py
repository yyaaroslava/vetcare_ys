from rest_framework import generics, status, permissions, viewsets, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import User
from .serializers import UserSerializer, RegisterSerializer
from .permissions import IsVetOrAdmin, IsAdminUser

# В'ю для реєстрації нових клієнтів
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Генерація токенів відразу після реєстрації
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

# Спеціальний серіалізатор для логіну, що повертає дані користувача разом з токенами
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    # Ми перехоплюємо 'email' замість 'username', щоб відповідати фронтенду
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Видаляємо дефолтне поле username, бо ми використовуємо email
        if 'username' in self.fields:
            del self.fields['username']

    def validate(self, attrs):
        # Переносимо email у поле username для внутрішньої логіки SimpleJWT
        attrs[self.username_field] = attrs.get('email')
        data = super().validate(attrs)
        
        data['user'] = UserSerializer(self.user).data
        data['tokens'] = {
            'refresh': data.pop('refresh'),
            'access': data.pop('access'),
        }
        return data

# В'ю для аутентифікації користувачів
class LoginView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

# В'ю для отримання даних профілю
class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

# В'ю для виходу із системи
class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist() # Додавання токена до чорного списку
        except Exception:
            pass
        return Response({'detail': 'Вихід виконано'}, status=status.HTTP_200_OK)


# Список лікарів — для вибору лікуючого лікаря при додаванні тварини
class VetListView(generics.ListAPIView):
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(role='doctor').order_by('first_name')


# Список клієнтів — доступний для лікарів та адмінів
class ClientListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsVetOrAdmin]

    def get_queryset(self):
        return User.objects.filter(role='client').order_by('first_name', 'last_name')
# Управління користувачами для адміна
class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = User.objects.all().order_by('-created_at')
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset
