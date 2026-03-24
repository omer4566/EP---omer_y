async function voteRoutes(fastify, options) {
  fastify.post("/", async (request, reply) => {
    const redis = fastify.redis;
    const { votes } = request.body; // Expecting { votes: [{ userId, optionIndex, pollId }] }

    if (!Array.isArray(votes) || votes.length === 0) {
      console.log("invalid votes array")
      return reply.send();
    }

    const uniqueVotesMap = new Map();
    for (const vote of votes) {
      if (vote.userId && vote.optionIndex !== undefined && vote.pollId) {
        const voterKey = `poll:${vote.pollId}:voter:${vote.userId}`;

        if (!uniqueVotesMap.has(voterKey)) {
          uniqueVotesMap.set(voterKey, vote);
        }
      }
    }

    const validVotes = Array.from(uniqueVotesMap.values());
    if (validVotes.length === 0) {
      return reply.send();
    }

    const voterKeys = validVotes.map(v => `poll:${v.pollId}:voter:${v.userId}`);
    const existingVotes = await redis.mget(voterKeys);

    const votesToProcess = validVotes.filter((_, index) => existingVotes[index] === null);
    if (votesToProcess.length === 0) {
      return reply.send();
    }

    const pipeline = redis.multi();
    for (const vote of votesToProcess) {
      pipeline.hIncrBy(`poll:${vote.pollId}:results`, String(vote.optionIndex), 1);
      pipeline.set(`poll:${vote.pollId}:voter:${vote.userId}`, "1");
    }
    await pipeline.exec();

    return reply.send({ success: true });
  });
}

module.exports = voteRoutes;
