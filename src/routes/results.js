async function resultsRoutes(fastify, options) {
  fastify.get("/", async (request, reply) => {
    const { pollId } = request.query;

    if (!pollId) {
      return reply.code(400).send({ error: "Missing pollId" });
    }

    const cachedResults = fastify.resultsCache.get(pollId);

    // Ensure keys are integers
    const results = {};
    for (const [key, count] of Object.entries(cachedResults.results)) {
      results[parseInt(key)] = count;
    }

    return reply.send({ results, total: cachedResults.total });
  });
}

module.exports = resultsRoutes;
