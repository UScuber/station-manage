import { FastifyInstance } from "fastify";
import { CACHE_CONTROL_VALUE } from "../../shared/cache";
import { StationCodeParams, StationGroupCodeParams } from "./schema";
import * as stationService from "./service";

export default async function (fastify: FastifyInstance) {
  fastify.get<{ Params: StationCodeParams }>("/station/:stationCode", {
    schema: { params: StationCodeParams },
  }, async (request, reply) => {
    const data = stationService.getStation(request.params.stationCode);
    if (!data) return reply.code(404).send({ error: "Not found" });
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });

  fastify.get<{ Params: StationGroupCodeParams }>("/stationGroup/:stationGroupCode", {
    schema: { params: StationGroupCodeParams },
  }, async (request, reply) => {
    const data = stationService.getStationGroup(request.params.stationGroupCode);
    if (!data) return reply.code(404).send({ error: "Not found" });
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });

  fastify.get<{ Params: StationGroupCodeParams }>("/stationsByGroupCode/:stationGroupCode", {
    onRequest: [fastify.optionalAuth],
    schema: { params: StationGroupCodeParams },
  }, async (request, reply) => {
    const data = stationService.getStationsByGroupCode(
      request.params.stationGroupCode,
      request.userId,
    );
    if (!data) return reply.code(404).send({ error: "Not found" });
    if (!request.userId) {
      reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    }
    return data;
  });
}
