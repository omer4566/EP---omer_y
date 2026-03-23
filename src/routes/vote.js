async function voteRoutes(fastify, options) {
  fastify.post("/", async (request, reply) => {
    const redis = fastify.redis;
    const { userId, optionIndex, pollId } = request.body;

    if (!userId || !optionIndex || !pollId) {
      return reply.code(400).send({ error: "Missing fields" });
    }

    const voterKey = `poll:${pollId}:voter:${userId}`;
    const alreadyVoted = await redis.exists(voterKey);
    if (alreadyVoted) {
      return reply.send({ success: false, reason: "already_voted" });
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

    return reply.send({ success: true, results });
  });
}

module.exports = voteRoutes;
