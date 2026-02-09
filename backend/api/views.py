# api/views
from django.shortcuts import render
from .models import User, MenuItem, PurchaseRequest, MealPayment, Subscription, MealIssued, Review
from rest_framework import generics
from .serializers import UserSerializer, MyTokenObtainPairSerializer, MenuItemSerializer, PurchaseRequestSerializer, ReviewSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from datetime import date, datetime, timedelta
from django.db.models import Count, Q




class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class WeeklyMenuView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        weekly_menu = {}
        for day in range(1, 8):
            breakfast = MenuItemSerializer(
                MenuItem.objects.filter(day_of_week=day, meal_type='breakfast'),
                many=True
            ).data
            lunch = MenuItemSerializer(
                MenuItem.objects.filter(day_of_week=day, meal_type='lunch'),
                many=True
            ).data
            weekly_menu[day] = {
                'breakfast': breakfast,
                'lunch': lunch
            }
        
        return Response(weekly_menu)




class CookDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Получаем все блюда (завтрак/обед) с остатками
        menu_items = MenuItem.objects.all()
        menu_data = MenuItemSerializer(menu_items, many=True).data

        # Получаем заявки повара
        requests = PurchaseRequest.objects.filter(created_by=request.user)
        requests_data = PurchaseRequestSerializer(requests, many=True).data

        return Response({
            'menu_items': menu_data,
            'purchase_requests': requests_data
        })

class IssueMealView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        meal_id = request.data.get('meal_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            meal = MenuItem.objects.get(id=meal_id)
            if meal.available_quantity >= quantity:
                meal.available_quantity -= quantity
                meal.save()
                return Response({'message': 'Выдано успешно', 'new_quantity': meal.available_quantity})
            else:
                return Response({'error': 'Недостаточно порций'}, status=400)
        except MenuItem.DoesNotExist:
            return Response({'error': 'Блюдо не найдено'}, status=404)

class CreatePurchaseRequestView(generics.CreateAPIView):
    serializer_class = PurchaseRequestSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)




class PayMealView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        date_str = request.data.get('date')  # "2026-02-07"
        meal_type = request.data.get('meal_type')  # "breakfast", "lunch", "combined"

        if not date_str or not meal_type:
            return Response({'error': 'Поле "date" и "meal_type" обязательны'}, status=400)

        try:
            from datetime import datetime
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Неверный формат даты (ожидается YYYY-MM-DD)'}, status=400)

        # Проверка: уже оплачено?
        if MealPayment.objects.filter(user=request.user, date=date_str, meal_type=meal_type).exists():
            return Response({'error': 'Уже оплачено'}, status=400)

        # Создаём запись об оплате
        MealPayment.objects.create(user=request.user, date=date_str, meal_type=meal_type)
        return Response({'message': 'Оплачено успешно'})



class BuySubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        today = date.today()
        # Проверяем: нет ли уже активного абонемента
        if Subscription.objects.filter(
            user=request.user,
            start_date__lte=today,
            end_date__gte=today
        ).exists():
            return Response({'error': 'У вас уже есть действующий абонемент'}, status=400)

        # Создаём новый
        sub = Subscription.objects.create(
            user=request.user,
            start_date=today
        )
        return Response({'message': 'Абонемент куплен', 'end_date': sub.end_date})




class PaidStudentsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        target_date = request.query_params.get('date')
        meal_type = request.query_params.get('meal_type')

        if not target_date or not meal_type:
            return Response({'error': 'Укажите date и meal_type'}, status=400)

        # Ученики, оплатившие (разовая оплата или абонемент)
        from datetime import datetime
        date_obj = datetime.strptime(target_date, '%Y-%m-%d').date()

        paid_users = []

        # 1. Разовая оплата
        meal_payments = MealPayment.objects.filter(
            date=target_date,
            meal_type=meal_type
        ).select_related('user')

        # 2. Абонемент
        subscriptions = Subscription.objects.filter(
            start_date__lte=date_obj,
            end_date__gte=date_obj
        ).select_related('user')

        user_ids = set()
        for p in meal_payments:
            user_ids.add(p.user_id)
        for s in subscriptions:
            user_ids.add(s.user_id)

        users = User.objects.filter(id__in=user_ids).values('id', 'username', 'role')
        return Response(list(users))



class IssueMealForUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get('user_id')
        meal_type = request.data.get('meal_type')
        date_str = request.data.get('date')

        # Валидация обязательных полей
        if not user_id or not meal_type or not date_str:
            return Response({
                'error': 'Обязательные поля: user_id, meal_type, date'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)

        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({
                'error': 'Неверный формат даты. Ожидается YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Проверка оплаты: разовая + абонемент
        paid_by_payment = MealPayment.objects.filter(
            user=user,
            date=date_str,          # ← если поле DateField, лучше использовать date_obj
            meal_type=meal_type
        ).exists()

        paid_by_subscription = Subscription.objects.filter(
            user=user,
            start_date__lte=date_obj,
            end_date__gte=date_obj
        ).exists()

        if not (paid_by_payment or paid_by_subscription):
            return Response({
                'error': 'Ученик не оплатил питание на эту дату и тип блюда'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Создаём запись выдачи (idempotent)
        issued, created = MealIssued.objects.get_or_create(
            user=user,
            date=date_obj,          # ← если поле DateField, используйте date_obj
            meal_type=meal_type
        )

        if not created:
            return Response({
                'message': 'Питание уже выдавалось ранее',
                'status': 'already_issued'
            }, status=status.HTTP_200_OK)

        return Response({
            'message': 'Выдано успешно',
            'issued': {
                'user_id': user.id,
                'username': user.username,
                'meal_type': meal_type,
                'date': date_str
            }
        }, status=status.HTTP_201_CREATED)





class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = date.today()
        one_week_ago = today - timedelta(days=7)

        today_payments = MealPayment.objects.filter(date=today).count()
        active_subscriptions = Subscription.objects.filter(
            start_date__lte=today,
            end_date__gte=today
        ).count()
        unique_students_today = MealIssued.objects.filter(date=today).values('user').distinct().count()
        meals_issued_today = MealIssued.objects.filter(date=today).count()

        return Response({
            'today_payments': today_payments,
            'active_subscriptions': active_subscriptions,
            'unique_students_today': unique_students_today,
            'meals_issued_today': meals_issued_today,
        })


class AdminPurchaseRequestsView(generics.ListAPIView):
    serializer_class = PurchaseRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PurchaseRequest.objects.select_related('created_by').all()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = []
        for req in queryset:
            data.append({
                'id': req.id,
                'product_name': req.product_name,
                'quantity': req.quantity,
                'unit': req.unit,
                'status': req.status,
                'created_by_username': req.created_by.username,
            })
        return Response(data)


class ApprovePurchaseRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            req = PurchaseRequest.objects.get(id=pk)
        except PurchaseRequest.DoesNotExist:
            return Response({'error': 'Заявка не найдена'}, status=404)

        approved = request.data.get('approved', True)
        req.status = 'approved' if approved else 'rejected'
        req.save()
        return Response({'message': 'Статус обновлён'})


class DailyReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        target_date_str = request.query_params.get('date')
        if not target_date_str:
            return Response({'error': 'Укажите date'}, status=400)

        try:
            target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Неверный формат даты'}, status=400)

        breakfast_count = MealIssued.objects.filter(date=target_date_str, meal_type='breakfast').count()
        lunch_count = MealIssued.objects.filter(date=target_date_str, meal_type='lunch').count()

        subscriptions_used = Subscription.objects.filter(
            start_date__lte=target_date,
            end_date__gte=target_date
        ).count()

        one_time_payments = MealPayment.objects.filter(date=target_date_str).count()
        meals_issued = MealIssued.objects.filter(date=target_date_str).count()

        return Response({
            'date': target_date_str,
            'breakfast_count': breakfast_count,
            'lunch_count': lunch_count,
            'subscriptions_used': subscriptions_used,
            'one_time_payments': one_time_payments,
            'meals_issued': meals_issued,
        })




class CreateReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)



class UserReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(user=self.request.user).order_by('-created_at')