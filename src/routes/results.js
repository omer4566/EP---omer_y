async function resultsRoutes(fastify, options) {
  fastify.get("/", async (request, reply) => {
    const redis = fastify.redis;
    const { pollId } = request.query;

    if (!pollId) {
      return reply.code(400).send({ error: "Missing pollId" });
    }

    const raw = await redis.hGetAll(`poll:${pollId}:results`);

    if (!raw || Object.keys(raw).length === 0) {
      return reply.send({ results: {}, total: 0 });
    }

    const results = {};
    let total = 0;
    for (const [k, v] of Object.entries(raw)) {
      const count = parseInt(v);
      results[parseInt(k)] = count;
      total += count;
    }

    return reply.send({ results, total });
  });
}

module.exports = resultsRoutes;
