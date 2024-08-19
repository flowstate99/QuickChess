const calculateElo = (playerRating, opponentRating, result) => {
  const k = 32;
  const expectedScore = 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
  return playerRating + k * (result - expectedScore);
};

// Example usage
const newRating = calculateElo(1500, 1600, 1); // Player wins
console.log(newRating);
