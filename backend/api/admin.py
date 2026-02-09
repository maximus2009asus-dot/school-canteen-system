from django.contrib import admin
from .models import MenuItem

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['day_of_week', 'meal_type', 'price', 'available_quantity']
    list_filter = ['day_of_week', 'meal_type']