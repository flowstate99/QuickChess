const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema({
  player1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  player2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  moves: [
    {
      type: [String],
      default: [],
    },
  ],
  result: {
    type: String,
    enum: ["win", "loss", "draw"], default: "draw"
  },
});

const Game = mongoose.model("Game", gameSchema);

module.exports = Game;