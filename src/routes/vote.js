const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  const redis = req.app.locals.redis;
  const { userId, optionIndex, pollId } = req.body;

  if (!userId || !optionIndex || !pollId) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const voterKey = `poll:${pollId}:voter:${userId}`;
  const alreadyVoted = await redis.exists(voterKey);
  if (alreadyVoted) {
    return res.json({ success: false, reason: "already_voted" });
  }

  await redis.multi()
    .hIncrBy(`poll:${pollId}:results`, String(optionIndex), 1)
    .set(voterKey, "1")
    .exec();

  const raw = await redis.hGetAll(`poll:${pollId}:results`);
  const results = {};
  for (const [k, v] of Object.entries(raw)) {
    results[parseInt(k)] = parseInt(v);
  }

  return res.json({ success: true, results });
});

module.exports = router;
