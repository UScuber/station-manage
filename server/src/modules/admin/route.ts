import { FastifyInstance } from "fastify";
import { StationCodeParams, UpdateTimetableURLBody, UpdateTrainPosURLBody } from "./schema";
import * as adminService from "./service";

export default async function (fastify: FastifyInstance) {
  // 時刻表と列車走行位置のURLを取得（公開API）
  fastify.get<{ Params: StationCodeParams }>("/timetableURL/:stationCode", {
    schema: { params: StationCodeParams },
  }, async (request) => {
    return adminService.getTimetableURL(request.params.stationCode);
  });

  // 時刻表のURL追加更新（管理者専用）
  fastify.put<{ Body: UpdateTimetableURLBody }>("/timetableURL", {
    onRequest: [fastify.authenticateAdmin],
    schema: { body: UpdateTimetableURLBody },
  }, async (request, reply) => {
    const { code, direction, mode, url } = request.body;
    const ok = adminService.updateTimetableURL(code, direction, mode, url);
    if (!ok) return reply.code(400).send({ error: "Bad Request" });
    return reply.send("OK");
  });

  // 列車走行位置のURL追加更新（管理者専用）
  fastify.put<{ Body: UpdateTrainPosURLBody }>("/trainPosURL", {
    onRequest: [fastify.authenticateAdmin],
    schema: { body: UpdateTrainPosURLBody },
  }, async (request, reply) => {
    adminService.updateTrainPosURL(request.body.code, request.body.url);
    return reply.send("OK");
  });

  // 時刻表と走行位置のURLのexport（管理者専用）
  fastify.post("/exportStationURL", {
    onRequest: [fastify.authenticateAdmin],
  }, async () => {
    return adminService.exportStationURL();
  });

  // 時刻表と走行位置のURLのimport（管理者専用）
  fastify.post<{ Body: Parameters<typeof adminService.importStationURL>[0] }>("/importStationURL", {
    onRequest: [fastify.authenticateAdmin],
    bodyLimit: 50 * 1024 * 1024, // 50MB
  }, async (request, reply) => {
    adminService.importStationURL(request.body);
    return reply.send("OK");
  });
}
