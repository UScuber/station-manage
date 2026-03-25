import "dotenv/config";
import Fastify from "fastify";
import ajvFormats from "ajv-formats";
import type { FastifyError } from "fastify";
import type { Plugin } from "ajv";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import authPlugin from "./src/plugins/auth";

// モジュール別ルート
import stationRoutes from "./src/modules/station/route";
import railwayRoutes from "./src/modules/railway/route";
import companyRoutes from "./src/modules/company/route";
import prefectureRoutes from "./src/modules/prefecture/route";
import searchRoutes from "./src/modules/search/route";
import geoRoutes from "./src/modules/geo/route";
import adminRoutes from "./src/modules/admin/route";
import historyRoutes from "./src/modules/history/route";
import progressRoutes from "./src/modules/progress/route";
import userRoutes from "./src/modules/user/route";

if (!process.env.REACT_URL) {
  console.error("Error: REACT_URL is not set");
  process.exit(1);
}

const fastify = Fastify({
  logger: true,
  ajv: { plugins: [ajvFormats as Plugin<unknown>] },
});

// セキュリティプラグイン
fastify.register(helmet);
fastify.register(cookie);
fastify.register(cors, {
  origin: process.env.REACT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});
fastify.register(rateLimit, {
  global: true,
  max: 500,
  timeWindow: "1 minute",
});

// 認証プラグイン
fastify.register(authPlugin);

// ヘルスチェック
fastify.get("/api/health", async () => "OK");

// ルート登録
fastify.register(stationRoutes, { prefix: "/api" });
fastify.register(railwayRoutes, { prefix: "/api" });
fastify.register(companyRoutes, { prefix: "/api" });
fastify.register(prefectureRoutes, { prefix: "/api" });
fastify.register(searchRoutes, { prefix: "/api" });
fastify.register(geoRoutes, { prefix: "/api" });
fastify.register(adminRoutes, { prefix: "/api" });
fastify.register(historyRoutes, { prefix: "/api" });
fastify.register(progressRoutes, { prefix: "/api" });
fastify.register(userRoutes, { prefix: "/api" });

// グローバルエラーハンドラ
fastify.setErrorHandler((error: FastifyError, request, reply) => {
  request.log.error(error);
  const statusCode = error.statusCode ?? 500;

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

const PORT = Number(process.env.PORT) || 3001;
fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
