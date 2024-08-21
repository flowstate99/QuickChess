const express = require('express');
const router = express.Router();
const { getBestMove } = require('../stockfishIntegration.js');

router.post('/move', async (req, res) => {
  const { position } = req.body;
  try {
    const bestMove = await getBestMove(position);
    res.json({ bestMove });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
