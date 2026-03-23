require("dotenv").config();
const fastify = require("fastify")({ logger: true });
const { createClient } = require("redis");

const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", (err) => console.error("Redis error:", err));
redis.connect().then(() => console.log("Redis connected"));

fastify.decorate("redis", redis);

fastify.get("/ping", async (request, reply) => {
  return { ok: true };
});

fastify.addHook("onRequest", async (request, reply) => {
  if (request.headers["x-secret"] !== process.env.SECRET_KEY) {
    reply.code(401).send({ error: "Unauthorized" });
  }
});

fastify.register(require("./routes/vote"), { prefix: "/vote" });
fastify.register(require("./routes/results"), { prefix: "/results" });

const PORT = process.env.PORT || 8080;
fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Poll backend running on port ${PORT}`);
});
