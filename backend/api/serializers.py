#api/selializers
from .models import User
from rest_framework import serializers
from .models import MenuItem
from .models import PurchaseRequest, Review
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password", "role", "allergies"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        # Получаем роль из validated_data, если она передана, иначе устанавливаем 'ученик'
        role = validated_data.get('role', 'ученик')
        
        # Проверяем, что роль допустима
        valid_roles = ['ученик', 'cook', 'admin', 'поваренок', 'администратор', 'student']
        if role not in valid_roles:
            # Если роль недопустима, устанавливаем значение по умолчанию
            role = 'ученик'
        
        validated_data['role'] = role
        user = User.objects.create_user(**validated_data)
        return user



class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['role'] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        # Добавляем полную информацию о пользователе в ответ
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'role': self.user.role,
            'allergies': self.user.allergies or ""
        }
        return data



class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'menu_items', 'price', 'available_quantity']



class PurchaseRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseRequest
        fields = ['id', 'product_name', 'quantity', 'unit', 'status', 'created_at']
        read_only_fields = ['created_by', 'status', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['date', 'meal_type', 'rating', 'comment']