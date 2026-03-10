const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  const redis = req.app.locals.redis;
  const { pollId } = req.query;

  if (!pollId) {
    return res.status(400).json({ error: "Missing pollId" });
  }

  const raw = await redis.hGetAll(`poll:${pollId}:results`);

  if (!raw || Object.keys(raw).length === 0) {
    return res.json({ results: {}, total: 0 });
  }

  const results = {};
  let total = 0;
  for (const [k, v] of Object.entries(raw)) {
    const count = parseInt(v);
    results[parseInt(k)] = count;
    total += count;
  }

  return res.json({ results, total });
});

module.exports = router;
