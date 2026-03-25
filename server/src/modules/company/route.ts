import { FastifyInstance } from "fastify";
import { CACHE_CONTROL_VALUE } from "../../shared/cache";
import { CompanyCodeParams } from "./schema";
import * as companyService from "./service";

export default async function (fastify: FastifyInstance) {
  fastify.get<{ Params: CompanyCodeParams }>("/company/:companyCode", {
    schema: { params: CompanyCodeParams },
  }, async (request, reply) => {
    const data = companyService.getCompany(request.params.companyCode);
    if (!data) return reply.code(404).send({ error: "Not found" });
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });

  fastify.get("/company", async (_request, reply) => {
    const data = companyService.getAllCompanies();
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });

  fastify.get<{ Params: CompanyCodeParams }>("/companyRailways/:companyCode", {
    schema: { params: CompanyCodeParams },
  }, async (request, reply) => {
    const data = companyService.getCompanyRailways(request.params.companyCode);
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    return data;
  });

  fastify.get<{ Params: CompanyCodeParams }>("/companyStations/:companyCode", {
    onRequest: [fastify.optionalAuth],
    schema: { params: CompanyCodeParams },
  }, async (request, reply) => {
    const data = companyService.getCompanyStations(
      request.params.companyCode,
      request.userId,
    );
    if (!request.userId) {
      reply.header("Cache-Control", CACHE_CONTROL_VALUE);
    }
    return data;
  });
}
