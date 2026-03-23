const History = require("../controllers/history");
const Progress = require("../controllers/progress");

module.exports = async function (fastify) {
  // --- 認証必須API ---

  fastify.get(
    "/latestStationHistory/:stationCode",
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["stationCode"],
          properties: {
            stationCode: { type: "integer" },
          },
        },
      },
    },
    History.latestStationHistory,
  );

  fastify.get(
    "/latestRailwayStationHistory/:railwayCode",
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["railwayCode"],
          properties: {
            railwayCode: { type: "integer" },
          },
        },
      },
    },
    History.latestStationHistoryList,
  );

  fastify.get(
    "/latestStationGroupHistory/:stationGroupCode",
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["stationGroupCode"],
          properties: {
            stationGroupCode: { type: "integer" },
          },
        },
      },
    },
    History.latestStationGroupHistory,
  );

  fastify.get(
    "/stationHistory",
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: {
          type: "object",
          required: ["off", "len"],
          properties: {
            off: { type: "integer", minimum: 0 },
            len: { type: "integer", minimum: 1, maximum: 200 },
            name: { type: "string", default: "" },
            type: { type: "string", enum: ["station", "railway", "company"] },
            dateFrom: { type: "string", format: "date-time" },
            dateTo: { type: "string", format: "date-time" },
          },
        },
      },
    },
    History.stationHistoryList,
  );

  fastify.get(
    "/stationHistoryCount",
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: {
          type: "object",
          properties: {
            name: { type: "string", default: "" },
            type: { type: "string", enum: ["station", "railway", "company"] },
            dateFrom: { type: "string", format: "date-time" },
            dateTo: { type: "string", format: "date-time" },
          },
        },
      },
    },
    History.stationHistoryCount,
  );

  fastify.get(
    "/stationHistoryAndInfo",
    {
      onRequest: [fastify.authenticate],
    },
    History.stationHistoryDetail,
  );

  fastify.get(
    "/stationHistory/:stationCode",
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["stationCode"],
          properties: {
            stationCode: { type: "integer" },
          },
        },
      },
    },
    History.stationHistory,
  );

  fastify.get(
    "/stationGroupHistory/:stationGroupCode",
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["stationGroupCode"],
          properties: {
            stationGroupCode: { type: "integer" },
          },
        },
      },
    },
    History.stationGroupHistory,
  );

  fastify.get(
    "/searchStationGroupListHistory",
    {
      onRequest: [fastify.authenticate],
      schema: {
        querystring: {
          type: "object",
          required: ["off", "len"],
          properties: {
            off: { type: "integer", minimum: 0 },
            len: { type: "integer", minimum: 1, maximum: 100 },
            name: { type: "string", default: "" },
          },
        },
      },
    },
    History.latestStationGroupHistoryList,
  );

  // Progress系
  fastify.get(
    "/railwayProgress/:railwayCode",
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["railwayCode"],
          properties: { railwayCode: { type: "integer" } },
        },
      },
    },
    Progress.railwayProgress,
  );

  fastify.get(
    "/railwayProgressList/:companyCode",
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["companyCode"],
          properties: { companyCode: { type: "integer" } },
        },
      },
    },
    Progress.railwayProgressList,
  );

  fastify.get(
    "/prefRailwayProgressList/:prefCode",
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["prefCode"],
          properties: {
            prefCode: { type: "integer", minimum: 1, maximum: 47 },
          },
        },
      },
    },
    Progress.railwayProgressListByPref,
  );

  fastify.get(
    "/railwayProgressList",
    {
      onRequest: [fastify.authenticate],
    },
    Progress.railwayProgressListAll,
  );

  fastify.get(
    "/companyProgress/:companyCode",
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["companyCode"],
          properties: { companyCode: { type: "integer" } },
        },
      },
    },
    Progress.companyProgress,
  );

  fastify.get(
    "/companyProgress",
    {
      onRequest: [fastify.authenticate],
    },
    Progress.companyProgressList,
  );

  fastify.get(
    "/prefProgress/:prefCode",
    {
      onRequest: [fastify.authenticate],
      schema: {
        params: {
          type: "object",
          required: ["prefCode"],
          properties: {
            prefCode: { type: "integer", minimum: 1, maximum: 47 },
          },
        },
      },
    },
    Progress.prefProgress,
  );

  fastify.get(
    "/prefProgress",
    {
      onRequest: [fastify.authenticate],
    },
    Progress.prefProgressList,
  );

  // --- 副作用のあるAPI（POST/DELETE） ---

  const stationDateSchema = {
    body: {
      type: "object",
      required: ["code", "date", "state"],
      properties: {
        code: { type: "integer" },
        date: { type: "string", format: "date-time" },
        state: { type: "integer", minimum: 0, maximum: 1 },
      },
    },
  };

  const stationGroupDateSchema = {
    body: {
      type: "object",
      required: ["code", "date"],
      properties: {
        code: { type: "integer" },
        date: { type: "string", format: "date-time" },
      },
    },
  };

  fastify.post("/stationDate", {
    onRequest: [fastify.authenticate],
    schema: stationDateSchema,
  }, History.postStationDate);

  fastify.post("/stationGroupDate", {
    onRequest: [fastify.authenticate],
    schema: stationGroupDateSchema,
  }, History.postStationGroupDate);

  fastify.delete("/stationDate", {
    onRequest: [fastify.authenticate],
    schema: stationDateSchema,
  }, History.deleteStationDate);

  fastify.delete("/stationGroupDate", {
    onRequest: [fastify.authenticate],
    schema: stationGroupDateSchema,
  }, History.deleteStationGroupDate);

  fastify.post(
    "/exportHistory",
    {
      onRequest: [fastify.authenticate],
    },
    History.exportHistory,
  );

  fastify.post(
    "/importHistory",
    {
      onRequest: [fastify.authenticate],
      bodyLimit: 50 * 1024 * 1024, // 50MB
    },
    History.importHistory,
  );
};
