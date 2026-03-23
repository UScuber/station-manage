require("dotenv").config();

if (!process.env.REACT_URL) {
  console.error("Error: REACT_URL is not set");
  process.exit(1);
}

const fastify = require("fastify")({
  logger: true,
  ajv: { plugins: [require("ajv-formats")] },
});

// セキュリティプラグイン
fastify.register(require("@fastify/helmet"));
fastify.register(require("@fastify/cookie"));
fastify.register(require("@fastify/cors"), {
  origin: process.env.REACT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});
fastify.register(require("@fastify/rate-limit"), {
  global: true,
  max: 500,
  timeWindow: "1 minute",
});

// 認証プラグイン
fastify.register(require("./src/plugins/auth"));

// ヘルスチェック
fastify.get("/api/health", async () => "OK");

// ルート登録
fastify.register(require("./src/routes/station"), { prefix: "/api" });
fastify.register(require("./src/routes/history"), { prefix: "/api" });
fastify.register(require("./src/routes/user"), { prefix: "/api" });

// グローバルエラーハンドラ
fastify.setErrorHandler((error, request, reply) => {
  request.log.error(error);
  const statusCode = error.statusCode || 500;

  let message;
  if (statusCode >= 500) {
    message = "Internal Server Error";
  } else if (error.validation) {
    message = "Bad Request";
  } else {
    message = error.message;
  }

  reply.code(statusCode).send({ error: message });
});

const PORT = process.env.PORT || 3001;
fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
