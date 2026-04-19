"""Core app URL configuration."""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='home'),
]
