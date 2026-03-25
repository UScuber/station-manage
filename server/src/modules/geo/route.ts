import { FastifyInstance } from "fastify";
import { CACHE_CONTROL_VALUE } from "../../shared/cache";
import { RailwayCodeParams, CompanyCodeParams } from "./schema";
import * as geoService from "./service";

export default async function (fastify: FastifyInstance) {
  fastify.get<{ Params: RailwayCodeParams }>("/railpaths/:railwayCode", {
    schema: { params: RailwayCodeParams },
  }, async (request, reply) => {
    const data = geoService.getRailPath(request.params.railwayCode);
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });

  fastify.get<{ Params: CompanyCodeParams }>("/pathslist/:companyCode", {
    schema: { params: CompanyCodeParams },
  }, async (request, reply) => {
    const data = geoService.getRailPathList(request.params.companyCode);
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });

  fastify.get("/allRailPaths", async (_request, reply) => {
    const data = geoService.getAllRailPaths();
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });
}
