import { FastifyInstance } from "fastify";
import { CACHE_CONTROL_VALUE } from "../../shared/cache";
import { PrefCodeParams } from "./schema";
import * as prefService from "./service";

export default async function (fastify: FastifyInstance) {
  fastify.get<{ Params: PrefCodeParams }>("/pref/:prefCode", {
    schema: { params: PrefCodeParams },
  }, async (request, reply) => {
    const data = prefService.getPrefecture(request.params.prefCode);
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });

  fastify.get("/pref", async (_request, reply) => {
    const data = prefService.getAllPrefectures();
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });

  fastify.get<{ Params: PrefCodeParams }>("/prefRailways/:prefCode", {
    schema: { params: PrefCodeParams },
  }, async (request, reply) => {
    const data = prefService.getPrefRailways(request.params.prefCode);
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });

  fastify.get<{ Params: PrefCodeParams }>("/prefStations/:prefCode", {
    onRequest: [fastify.optionalAuth],
    schema: { params: PrefCodeParams },
  }, async (request, reply) => {
    const data = prefService.getPrefStations(
      request.params.prefCode,
      request.userId,
    );
    if (!request.userId) {
      reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    }
    return data;
  });
}
