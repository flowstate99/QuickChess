const express = require("express");
const router = express.Router();
const Game = require("../models/Game");

// create a new game
router.post("/", async (req, res) => {
  try {
    const { player1, player2 } = req.body;
    const game = await Game.create({ player1, player2 });
    res.status(201).json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get game by id
router.get("/:id", async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).populate("player1 player2");
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }
    res.status(200).json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// update game by id
router.put("/:id", async (req, res) => {
  try {
    const moves = req.body;
    const game = await Game.findById(req.params.id);
    game.moves.push(moves);
    await game.save();
    res.status(200).json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;