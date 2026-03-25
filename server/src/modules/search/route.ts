import { FastifyInstance } from "fastify";
import { PaginatedSearchQuery, SearchCountQuery, NearestStationQuery } from "./schema";
import * as searchService from "./service";

export default async function (fastify: FastifyInstance) {
  fastify.get<{ Querystring: PaginatedSearchQuery }>("/searchStationGroupList", {
    schema: { querystring: PaginatedSearchQuery },
  }, async (request) => {
    return searchService.searchStationGroupList(
      request.query.name ?? "",
      request.query.off,
      request.query.len,
    );
  });

  fastify.get<{ Querystring: SearchCountQuery }>("/searchStationGroupCount", {
    schema: { querystring: SearchCountQuery },
  }, async (request) => {
    return searchService.searchStationGroupCount(request.query.name ?? "");
  });

  fastify.get<{ Querystring: NearestStationQuery }>("/searchNearestStationGroup", {
    schema: { querystring: NearestStationQuery },
  }, async (request) => {
    return searchService.searchNearestStationGroups(
      request.query.lat,
      request.query.lng,
      request.query.num ?? 20,
    );
  });
}
