#api/models
from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import timedelta
from django.contrib.auth import get_user_model

class User(AbstractUser):
    role = models.CharField(max_length=50, default='ученик')
    allergies = models.TextField(blank=True, verbose_name="Пищевые аллергии")


class MenuItem(models.Model):
    DAY_CHOICES = [
        (1, 'Понедельник'),
        (2, 'Вторник'),
        (3, 'Среда'),
        (4, 'Четверг'),
        (5, 'Пятница'),
        (6, 'Суббота'),
        (7, 'Воскресенье'),
    ]
    
    MEAL_TYPES = [
        ('breakfast', 'Завтрак'),
        ('lunch', 'Обед'),
    ]
    
    day_of_week = models.IntegerField(
    choices=DAY_CHOICES,
    verbose_name="День недели",
    null=True,
    blank=True      
    )
    meal_type = models.CharField(max_length=20, choices=MEAL_TYPES, verbose_name="Тип приёма пищи")
    menu_items = models.TextField(verbose_name="Состав меню")  # Например: "Омлет, каша, чай"
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена за приём пищи")
    available_quantity = models.PositiveIntegerField(default=0, verbose_name="Остаток порций")


    class Meta:
        verbose_name = "Приём пищи"
        verbose_name_plural = "Меню"
        unique_together = ['day_of_week', 'meal_type']



class PurchaseRequest(models.Model):
    product_name = models.CharField(max_length=255, verbose_name="Название продукта")
    quantity = models.PositiveIntegerField(verbose_name="Количество")
    unit = models.CharField(max_length=50, verbose_name="Единица измерения")
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Ожидает'), ('approved', 'Одобрено'), ('rejected', 'Отклонено')],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        verbose_name = "Заявка на закупку"
        verbose_name_plural = "Заявки на закупку"




class MealPayment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()  # дата, на которую оплачено
    meal_type = models.CharField(max_length=20, choices=[('breakfast', 'Завтрак'), ('lunch', 'Обед'), ('combined', 'Комплекс')])
    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'date', 'meal_type']


class Subscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()  # = start_date + 30 дней
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Абонемент"
        verbose_name_plural = "Абонементы"

    def save(self, *args, **kwargs):
        if not self.end_date:
            self.end_date = self.start_date + timedelta(days=30)
        super().save(*args, **kwargs)


class MealIssued(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    meal_type = models.CharField(max_length=20, choices=[('breakfast', 'Завтрак'), ('lunch', 'Обед'), ('combined', 'Комплекс')])
    issued_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'date', 'meal_type']


User = get_user_model()

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    meal_type = models.CharField(max_length=10, choices=[('breakfast', 'Завтрак'), ('lunch', 'Обед')])
    rating = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} — {self.meal_type} ({self.rating}⭐)"