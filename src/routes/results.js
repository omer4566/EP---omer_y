async function resultsRoutes(fastify, options) {
  fastify.get("/", async (request, reply) => {
    const { pollId } = request.query;

    if (!pollId) {
      return reply.code(400).send({ error: "Missing pollId" });
    }

    const cachedResults = fastify.resultsCache.get(pollId);

    if (!cachedResults) {
      return reply.send({ results: {}, total: 0 });
    }

    return reply.send(cachedResults);
  });
}

module.exports = resultsRoutes;
