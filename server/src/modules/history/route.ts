import { FastifyInstance } from "fastify";
import {
  StationCodeParams,
  StationGroupCodeParams,
  RailwayCodeParams,
  HistoryListQuery,
  HistoryFilterQuery,
  PaginatedSearchHistoryQuery,
  StationDateBody,
  StationGroupDateBody,
  ImportHistoryBody,
} from "./schema";
import * as historyService from "./service";

export default async function (fastify: FastifyInstance) {
  // --- 認証必須API ---

  fastify.get<{ Params: StationCodeParams }>("/latestStationHistory/:stationCode", {
    onRequest: [fastify.authenticate],
    schema: { params: StationCodeParams },
  }, async (request) => {
    return historyService.getLatestStationHistory(
      request.params.stationCode,
      request.userId!,
    );
  });

  fastify.get<{ Params: RailwayCodeParams }>("/latestRailwayStationHistory/:railwayCode", {
    onRequest: [fastify.authenticate],
    schema: { params: RailwayCodeParams },
  }, async (request) => {
    return historyService.getLatestStationHistoryByRailway(
      request.params.railwayCode,
      request.userId!,
    );
  });

  fastify.get<{ Params: StationGroupCodeParams }>("/latestStationGroupHistory/:stationGroupCode", {
    onRequest: [fastify.authenticate],
    schema: { params: StationGroupCodeParams },
  }, async (request) => {
    return historyService.getLatestStationGroupHistory(
      request.params.stationGroupCode,
      request.userId!,
    );
  });

  fastify.get<{ Querystring: HistoryListQuery }>("/stationHistory", {
    onRequest: [fastify.authenticate],
    schema: { querystring: HistoryListQuery },
  }, async (request) => {
    return historyService.getStationHistoryList(
      request.query,
      request.userId!,
      request.query.off,
      request.query.len,
    );
  });

  fastify.get<{ Querystring: HistoryFilterQuery }>("/stationHistoryCount", {
    onRequest: [fastify.authenticate],
    schema: { querystring: HistoryFilterQuery },
  }, async (request) => {
    return historyService.getStationHistoryCount(request.query, request.userId!);
  });

  fastify.get("/stationHistoryAndInfo", {
    onRequest: [fastify.authenticate],
  }, async (request) => {
    return historyService.getStationHistoryDetail(request.userId!);
  });

  fastify.get("/allStationGroupHistory", {
    onRequest: [fastify.authenticate],
  }, async (request) => {
    return historyService.getAllStationGroupHistory(request.userId!);
  });

  fastify.get<{ Params: StationCodeParams }>("/stationHistory/:stationCode", {
    onRequest: [fastify.authenticate],
    schema: { params: StationCodeParams },
  }, async (request) => {
    return historyService.getStationHistory(
      request.params.stationCode,
      request.userId!,
    );
  });

  fastify.get<{ Params: StationGroupCodeParams }>("/stationGroupHistory/:stationGroupCode", {
    onRequest: [fastify.authenticate],
    schema: { params: StationGroupCodeParams },
  }, async (request) => {
    return historyService.getStationGroupHistory(
      request.params.stationGroupCode,
      request.userId!,
    );
  });

  fastify.get<{ Querystring: PaginatedSearchHistoryQuery }>("/searchStationGroupListHistory", {
    onRequest: [fastify.authenticate],
    schema: { querystring: PaginatedSearchHistoryQuery },
  }, async (request) => {
    return historyService.searchStationGroupHistoryList(
      request.query.name ?? "",
      request.userId!,
      request.query.off,
      request.query.len,
    );
  });

  // --- 副作用のあるAPI（POST/DELETE） ---

  fastify.post<{ Body: StationDateBody }>("/stationDate", {
    onRequest: [fastify.authenticate],
    schema: { body: StationDateBody },
  }, async (request, reply) => {
    const { code, date, state } = request.body;
    historyService.postStationDate(code, date, state, request.userId!);
    return reply.send("OK");
  });

  fastify.post<{ Body: StationGroupDateBody }>("/stationGroupDate", {
    onRequest: [fastify.authenticate],
    schema: { body: StationGroupDateBody },
  }, async (request, reply) => {
    const { code, date } = request.body;
    historyService.postStationGroupDate(code, date, request.userId!);
    return reply.send("OK");
  });

  fastify.delete<{ Body: StationDateBody }>("/stationDate", {
    onRequest: [fastify.authenticate],
    schema: { body: StationDateBody },
  }, async (request, reply) => {
    const { code, date, state } = request.body;
    historyService.deleteStationDate(code, date, state, request.userId!);
    return reply.send("OK");
  });

  fastify.delete<{ Body: StationGroupDateBody }>("/stationGroupDate", {
    onRequest: [fastify.authenticate],
    schema: { body: StationGroupDateBody },
  }, async (request, reply) => {
    const { code, date } = request.body;
    historyService.deleteStationGroupDate(code, date, request.userId!);
    return reply.send("OK");
  });

  fastify.post("/exportHistory", {
    onRequest: [fastify.authenticate],
  }, async (request) => {
    return historyService.exportHistory(request.userId!);
  });

  fastify.post<{ Body: ImportHistoryBody }>("/importHistory", {
    onRequest: [fastify.authenticate],
    schema: { body: ImportHistoryBody },
    bodyLimit: 50 * 1024 * 1024, // 50MB
  }, async (request, reply) => {
    historyService.importHistory(request.body, request.userId!);
    return reply.send("OK");
  });
}
