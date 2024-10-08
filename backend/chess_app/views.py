from rest_framework import status, viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from .serializers import ChessGameSerializer, UserSerializer
import logging
from .models import ChessGame

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
  username = request.data.get('username')
  password = request.data.get('password')
  
  logger.info(f"Login attempt for user: {username}")
  
  if username is None or password is None:
    logger.warning("Login attempt with missing username or password")
    return Response({'error': 'Please provide both username and password'},
                    status=status.HTTP_400_BAD_REQUEST)
  
  user = authenticate(username=username, password=password)
  
  if user:
    login(request, user)
    serializer = UserSerializer(user)
    logger.info(f"Successful login for user: {username}")
    return Response(serializer.data)
  else:
    if User.objects.filter(username=username).exists():
        logger.warning(f"Failed login attempt for user: {username}")
        return Response({'error': 'Incorrect password'},
                        status=status.HTTP_401_UNAUTHORIZED)
    else:
      logger.warning(f"Failed login attempt for user: {username}")
      return Response({'error': 'User does not exist'},
                      status=status.HTTP_401_UNAUTHORIZED)
            

@api_view(['POST'])
@permission_classes([AllowAny])
def user_register(request):
  username = request.data.get('username')
  password = request.data.get('password')
  
  logger.info(f"Registration attempt for user: {username}")
  
  if username is None or password is None:
    logger.warning("Registration attempt with missing username or password")
    return Response({'error': 'Please provide both username and password'},
                    status=status.HTTP_400_BAD_REQUEST)
  
  if User.objects.filter(username=username).exists():
    logger.warning(f"Registration attempt for existing user: {username}")
    return Response({'error': 'User already exists'},
                    status=status.HTTP_400_BAD_REQUEST)
  
  user = User.objects.create_user(username=username, password=password)
  login(request, user)
  serializer = UserSerializer(user)
  logger.info(f"Successful registration for user: {username}")
  return Response(serializer.data, status=status.HTTP_201_CREATED)

class ChessGameViewSet(viewsets.ModelViewSet):
  queryset = ChessGame.objects.all()
  serializer_class = ChessGameSerializer
  permission_classes = [permissions.IsAuthenticated]