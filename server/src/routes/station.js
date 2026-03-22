const Station = require("../controllers/station");

module.exports = async function (fastify) {
  // --- 公開API（認証不要、キャッシュ可能） ---

  fastify.get(
    "/station/:stationCode",
    {
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
    Station.station,
  );

  fastify.get(
    "/stationGroup/:stationGroupCode",
    {
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
    Station.groupStations,
  );

  // stationsByGroupCode は optionalAuth（未ログインでも取得可能だが、ログイン時は visitType 付与）
  fastify.get(
    "/stationsByGroupCode/:stationGroupCode",
    {
      onRequest: [fastify.optionalAuth],
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
    Station.stationGroup,
  );

  fastify.get(
    "/railway/:railwayCode",
    {
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
    Station.railway,
  );

  fastify.get("/railway", Station.railways);

  fastify.get(
    "/railwayStations/:railwayCode",
    {
      onRequest: [fastify.optionalAuth],
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
    Station.railwayStations,
  );

  fastify.get(
    "/company/:companyCode",
    {
      schema: {
        params: {
          type: "object",
          required: ["companyCode"],
          properties: {
            companyCode: { type: "integer" },
          },
        },
      },
    },
    Station.company,
  );

  fastify.get("/company", Station.companies);

  fastify.get(
    "/companyRailways/:companyCode",
    {
      schema: {
        params: {
          type: "object",
          required: ["companyCode"],
          properties: {
            companyCode: { type: "integer" },
          },
        },
      },
    },
    Station.companyRailways,
  );

  fastify.get(
    "/companyStations/:companyCode",
    {
      onRequest: [fastify.optionalAuth],
      schema: {
        params: {
          type: "object",
          required: ["companyCode"],
          properties: {
            companyCode: { type: "integer" },
          },
        },
      },
    },
    Station.companyStations,
  );

  fastify.get(
    "/prefRailways/:prefCode",
    {
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
    Station.prefRailways,
  );

  fastify.get(
    "/prefStations/:prefCode",
    {
      onRequest: [fastify.optionalAuth],
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
    Station.prefStations,
  );

  fastify.get(
    "/searchStationGroupList",
    {
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
    Station.stationGroupList,
  );

  fastify.get(
    "/searchStationGroupCount",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            name: { type: "string", default: "" },
          },
        },
      },
    },
    Station.stationGroupCount,
  );

  fastify.get(
    "/searchNearestStationGroup",
    {
      schema: {
        querystring: {
          type: "object",
          required: ["lat", "lng"],
          properties: {
            lat: { type: "number" },
            lng: { type: "number" },
            num: { type: "integer", minimum: 1, maximum: 20, default: 20 },
          },
        },
      },
    },
    Station.searchKNearestStationGroups,
  );

  fastify.get(
    "/pref/:prefCode",
    {
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
    Station.prefecture,
  );

  fastify.get("/pref", Station.prefectures);

  fastify.get(
    "/railpaths/:railwayCode",
    {
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
    Station.railPath,
  );

  fastify.get(
    "/pathslist/:companyCode",
    {
      schema: {
        params: {
          type: "object",
          required: ["companyCode"],
          properties: {
            companyCode: { type: "integer" },
          },
        },
      },
    },
    Station.railPathList,
  );

  fastify.get("/allRailPaths", Station.allRailPaths);

  fastify.get(
    "/timetableURL/:stationCode",
    {
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
    Station.timetableURL,
  );

  // --- 管理者API ---

  fastify.put(
    "/timetableURL",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        body: {
          type: "object",
          required: ["code", "direction", "mode"],
          properties: {
            code: { type: "integer" },
            direction: { type: "string" },
            mode: { type: "string", enum: ["update", "delete"] },
            url: { type: "string" },
          },
        },
      },
    },
    Station.updateTimetableURL,
  );

  fastify.put(
    "/trainPosURL",
    {
      onRequest: [fastify.authenticateAdmin],
      schema: {
        body: {
          type: "object",
          required: ["code", "url"],
          properties: {
            code: { type: "integer" },
            url: { type: "string" },
          },
        },
      },
    },
    Station.updateTrainPosURL,
  );

  fastify.post(
    "/exportStationURL",
    {
      onRequest: [fastify.authenticateAdmin],
    },
    Station.exportStationURL,
  );

  fastify.post(
    "/importStationURL",
    {
      onRequest: [fastify.authenticateAdmin],
      bodyLimit: 50 * 1024 * 1024, // 50MB
    },
    Station.importStationURL,
  );
};
