import { FastifyInstance } from "fastify";
import { RailwayCodeParams, CompanyCodeParams, PrefCodeParams } from "./schema";
import * as progressService from "./service";

export default async function (fastify: FastifyInstance) {
  fastify.get<{ Params: RailwayCodeParams }>("/railwayProgress/:railwayCode", {
    onRequest: [fastify.authenticate],
    schema: { params: RailwayCodeParams },
  }, async (request) => {
    return progressService.getRailwayProgress(
      request.params.railwayCode,
      request.userId!,
    );
  });

  fastify.get<{ Params: CompanyCodeParams }>("/railwayProgressList/:companyCode", {
    onRequest: [fastify.authenticate],
    schema: { params: CompanyCodeParams },
  }, async (request) => {
    return progressService.getRailwayProgressList(
      request.params.companyCode,
      request.userId!,
    );
  });

  fastify.get<{ Params: PrefCodeParams }>("/prefRailwayProgressList/:prefCode", {
    onRequest: [fastify.authenticate],
    schema: { params: PrefCodeParams },
  }, async (request) => {
    return progressService.getRailwayProgressListByPref(
      request.params.prefCode,
      request.userId!,
    );
  });

  fastify.get("/railwayProgressList", {
    onRequest: [fastify.authenticate],
  }, async (request) => {
    return progressService.getRailwayProgressListAll(request.userId!);
  });

  fastify.get<{ Params: CompanyCodeParams }>("/companyProgress/:companyCode", {
    onRequest: [fastify.authenticate],
    schema: { params: CompanyCodeParams },
  }, async (request) => {
    return progressService.getCompanyProgress(
      request.params.companyCode,
      request.userId!,
    );
  });

  fastify.get("/companyProgress", {
    onRequest: [fastify.authenticate],
  }, async (request) => {
    return progressService.getCompanyProgressList(request.userId!);
  });

  fastify.get<{ Params: PrefCodeParams }>("/prefProgress/:prefCode", {
    onRequest: [fastify.authenticate],
    schema: { params: PrefCodeParams },
  }, async (request) => {
    return progressService.getPrefProgress(
      request.params.prefCode,
      request.userId!,
    );
  });

  fastify.get("/prefProgress", {
    onRequest: [fastify.authenticate],
  }, async (request) => {
    return progressService.getPrefProgressList(request.userId!);
  });
}
