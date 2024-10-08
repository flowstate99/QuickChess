from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'games', views.ChessGameViewSet)

urlpatterns = [
    path('login/', views.user_login),
    path('register/', views.user_register),
    # path('logout/', views.user_logout),
    path('', include(router.urls)),
]