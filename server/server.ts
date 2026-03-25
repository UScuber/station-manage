import "dotenv/config";
import { buildApp } from "./app";

if (!process.env.REACT_URL) {
  console.error("Error: REACT_URL is not set");
  process.exit(1);
}

const fastify = buildApp();

const PORT = Number(process.env.PORT) || 3001;
fastify.listen({ port: PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
