from django.db import models
from django.contrib.auth.models import User

class ChessGame(models.Model):
    player1 = models.ForeignKey(User, related_name='games_as_player1', on_delete=models.CASCADE)
    player2 = models.ForeignKey(User, related_name='games_as_player2', on_delete=models.CASCADE)
    board_state = models.TextField()  # Store the board state as JSON
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

