import { FastifyInstance } from "fastify";
import { CACHE_CONTROL_VALUE } from "../../shared/cache";
import { RailwayCodeParams } from "./schema";
import * as railwayService from "./service";

export default async function (fastify: FastifyInstance) {
  fastify.get<{ Params: RailwayCodeParams }>("/railway/:railwayCode", {
    schema: { params: RailwayCodeParams },
  }, async (request, reply) => {
    const data = railwayService.getRailway(request.params.railwayCode);
    if (!data) return reply.code(404).send({ error: "Not found" });
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });

  fastify.get("/railway", async (_request, reply) => {
    const data = railwayService.getAllRailways();
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });

  fastify.get<{ Params: RailwayCodeParams }>("/railwayStations/:railwayCode", {
    onRequest: [fastify.optionalAuth],
    schema: { params: RailwayCodeParams },
  }, async (request, reply) => {
    const data = railwayService.getRailwayStations(
      request.params.railwayCode,
      request.userId,
    );
    if (!data) return reply.code(404).send({ error: "Not found" });
    if (!request.userId) {
      reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    }
    return data;
  });
}
