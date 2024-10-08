# chess_app/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ChessGame

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ChessGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChessGame
        fields = '__all__'