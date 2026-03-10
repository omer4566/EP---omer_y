require("dotenv").config();
const express = require("express");
const { createClient } = require("redis");

const app = express();
app.use(express.json());

const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", (err) => console.error("Redis error:", err));
redis.connect().then(() => console.log("Redis connected"));

app.locals.redis = redis;

app.use((req, res, next) => {
  if (req.headers["x-secret"] !== process.env.SECRET_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

app.use("/vote", require("./routes/vote"));
app.use("/results", require("./routes/results"));

app.get("/ping", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Poll backend running on port ${PORT}`));
