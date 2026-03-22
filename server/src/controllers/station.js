const { db } = require("../db/connection");
const {
  insert_next_stations,
  CACHE_CONTROL_VALUE,
  attachVisitType,
  escapeLikePattern,
} = require("../components/lib");
const { JR_COMPANY_CODE_MAX } = require("../constants");
const { export_stationURL } = require("../components/export-sql");
const { import_stationURL } = require("../components/import-sql");


// 駅情報取得
// /api/station/:stationCode
exports.station = async (request, reply) => {
  const stationCode = request.params.stationCode;
  let data = db.prepare(`
    SELECT
      Stations.*,
      StationGroups.stationName,
      StationGroups.kana,
      Prefectures.code AS prefCode,
      Prefectures.name AS prefName,
      Railways.railwayName,
      Railways.railwayCode,
      Railways.railwayColor,
      Companies.companyCode,
      Companies.companyName AS railwayCompany
    FROM Stations
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
        AND Stations.stationCode = ?
    INNER JOIN Prefectures
      ON StationGroups.prefCode = Prefectures.code
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
  `).get(stationCode);

  if (!data) {
    return reply.code(404).send({ error: "Not found" });
  }
  data = insert_next_stations(data, stationCode);
  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};


// 駅グループの情報取得
// /api/stationGroup/:stationGroupCode
exports.groupStations = async (request, reply) => {
  const stationGroupCode = request.params.stationGroupCode;
  const data = db.prepare(`
    SELECT
      StationGroups.*,
      Prefectures.name AS prefName
    FROM Stations
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
        AND Stations.stationGroupCode = ?
    INNER JOIN Prefectures
      ON StationGroups.prefCode = Prefectures.code
    GROUP BY Stations.stationGroupCode
  `).get(stationGroupCode);

  if (!data) {
    return reply.code(404).send({ error: "Not found" });
  }
  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};


// 駅グループに属する駅の駅情報を取得
// /api/stationsByGroupCode/:stationGroupCode
exports.stationGroup = async (request, reply) => {
  const stationGroupCode = request.params.stationGroupCode;
  let data = db.prepare(`
    SELECT
      Stations.*,
      StationGroups.stationName,
      StationGroups.kana,
      Railways.railwayName,
      Railways.railwayColor,
      Companies.companyCode,
      Companies.companyName AS railwayCompany
    FROM Stations
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
        AND Stations.stationGroupCode = ?
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
  `).all(stationGroupCode);

  if (!data.length) {
    return reply.code(404).send({ error: "Not found" });
  }
  data = data.map(station => insert_next_stations(station, station.stationCode));

  const userId = request.userId;
  data = attachVisitType(data, userId);
  if (!userId) {
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  }
  return data;
};


// 路線情報取得
// /api/railway/:railwayCode
exports.railway = async (request, reply) => {
  const railwayCode = request.params.railwayCode;
  const data = db.prepare(`
    SELECT
      Railways.*,
      Companies.companyName,
      Companies.formalName AS companyFormalName
    FROM Railways
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
        AND Railways.railwayCode = ?
  `).get(railwayCode);

  if (!data) {
    return reply.code(404).send({ error: "Not found" });
  }
  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};


// 路線情報全取得
// /api/railway
exports.railways = async (request, reply) => {
  const data = db.prepare(`
    SELECT
      Railways.*,
      Companies.companyName,
      Companies.formalName AS companyFormalName
    FROM Railways
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
  `).all();

  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};


// 路線に属する駅の駅情報を取得
// /api/railwayStations/:railwayCode
exports.railwayStations = async (request, reply) => {
  const railwayCode = request.params.railwayCode;
  let data = db.prepare(`
    SELECT
      Stations.*,
      StationGroups.stationName,
      StationGroups.kana,
      Prefectures.code AS prefCode,
      Prefectures.name AS prefName,
      Railways.railwayName,
      Railways.railwayColor,
      Companies.companyCode,
      Companies.companyName AS railwayCompany
    FROM Stations
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
        AND Stations.railwayCode = ?
    INNER JOIN Prefectures
      ON StationGroups.prefCode = Prefectures.code
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
  `).all(railwayCode);

  if (!data.length) {
    return reply.code(404).send({ error: "Not found" });
  }
  data = data.map(station => insert_next_stations(station, station.stationCode));

  const userId = request.userId;
  data = attachVisitType(data, userId);
  if (!userId) {
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  }
  return data;
};


// 会社情報取得
// /api/company/:companyCode
exports.company = async (request, reply) => {
  const companyCode = request.params.companyCode;
  let data;
  if (companyCode === 0) {
    data = {
      companyCode: 0,
      companyName: "JR",
      formalName: "JR",
    };
  } else {
    data = db.prepare(`
      SELECT * FROM Companies
      WHERE companyCode = ?
    `).get(companyCode);
  }

  if (!data) {
    return reply.code(404).send({ error: "Not found" });
  }
  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};


// 会社情報全取得
// /api/company
exports.companies = async (request, reply) => {
  const data = db.prepare(`
    SELECT * FROM Companies
    ORDER BY companyCode
  `).all();

  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};


// 会社に属する路線の路線情報を取得
// /api/companyRailways/:companyCode
exports.companyRailways = async (request, reply) => {
  const companyCode = request.params.companyCode;
  let data;
  if (companyCode === 0) {
    data = db.prepare(`
      SELECT * FROM Railways
      WHERE companyCode <= ?
      ORDER BY railwayCode
    `).all(JR_COMPANY_CODE_MAX);
  } else {
    data = db.prepare(`
      SELECT * FROM Railways
      WHERE companyCode = ?
      ORDER BY railwayCode
    `).all(companyCode);
  }

  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};


// 会社に属する路線の駅情報を全取得
// /api/companyStations/:companyCode
exports.companyStations = async (request, reply) => {
  const companyCode = request.params.companyCode;
  let data;
  if (companyCode === 0) {
    data = db.prepare(`
      SELECT
        Stations.*,
        StationGroups.stationName,
        StationGroups.kana,
        Prefectures.code AS prefCode,
        Prefectures.name AS prefName,
        Railways.railwayName,
        Railways.railwayColor,
        Companies.companyCode,
        Companies.companyName AS railwayCompany
      FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
          AND Railways.companyCode <= ?
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
      INNER JOIN Prefectures
        ON StationGroups.prefCode = Prefectures.code
    `).all(JR_COMPANY_CODE_MAX);
  } else {
    data = db.prepare(`
      SELECT
        Stations.*,
        StationGroups.stationName,
        StationGroups.kana,
        Prefectures.code AS prefCode,
        Prefectures.name AS prefName,
        Railways.railwayName,
        Railways.railwayColor,
        Companies.companyCode,
        Companies.companyName AS railwayCompany
      FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
          AND Railways.companyCode = ?
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
      INNER JOIN Prefectures
        ON StationGroups.prefCode = Prefectures.code
    `).all(companyCode);
  }

  data = data.map(station => insert_next_stations(station, station.stationCode));

  const userId = request.userId;
  data = attachVisitType(data, userId);
  if (!userId) {
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  }
  return data;
};


// 県に属する路線の路線情報を取得
// /api/prefRailways/:prefCode
exports.prefRailways = async (request, reply) => {
  const prefCode = request.params.prefCode;
  const data = db.prepare(`
    SELECT
      Railways.railwayCode,
      Railways.railwayName,
      Railways.formalName,
      Railways.railwayKana,
      Railways.railwayColor,
      Railways.companyCode,
      Companies.companyName
    FROM Railways
    INNER JOIN Stations
      ON Railways.railwayCode = Stations.railwayCode
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
        AND StationGroups.prefCode = ?
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
    GROUP BY Railways.railwayCode
  `).all(prefCode);

  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};


// 県に属する路線の駅情報を全取得
// /api/prefStations/:prefCode
exports.prefStations = async (request, reply) => {
  const prefCode = request.params.prefCode;
  let data = db.prepare(`
    SELECT
      Stations.*,
      StationGroups.stationName,
      StationGroups.kana,
      Railways.railwayName,
      Railways.formalName,
      Railways.railwayKana,
      Railways.railwayColor,
      Railways.companyCode,
      Companies.companyName AS railwayCompany,
      Prefectures.code AS prefCode,
      Prefectures.name AS prefName
    FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    INNER JOIN (
      SELECT Railways.railwayCode FROM Railways
      INNER JOIN Stations
        ON Railways.railwayCode = Stations.railwayCode
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND StationGroups.prefCode = ?
      GROUP BY Railways.railwayCode
    ) AS Codes
      ON Stations.railwayCode = Codes.railwayCode
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
    INNER JOIN Prefectures
      ON StationGroups.prefCode = Prefectures.code
  `).all(prefCode);

  data = data.map(station => insert_next_stations(station, station.stationCode));

  const userId = request.userId;
  data = attachVisitType(data, userId);
  if (!userId) {
    reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  }
  return data;
};


// 駅グループを名前で検索、区間指定
// /api/searchStationGroupList
exports.stationGroupList = async (request, reply) => {
  const { off, len, name } = request.query;
  let data;
  if (name === "") {
    data = db.prepare(`
      SELECT
        StationGroups.*,
        Prefectures.code AS prefCode,
        Prefectures.name AS prefName,
        0 AS ord
      FROM StationGroups
      INNER JOIN Prefectures
        ON StationGroups.prefCode = Prefectures.code
      LIMIT ? OFFSET ?
    `).all(len, off);
  } else {
    const escaped = escapeLikePattern(name);
    data = db.prepare(`
      WITH StationData AS (
        SELECT
          StationGroups.*,
          Prefectures.code AS prefCode,
          Prefectures.name AS prefName
        FROM StationGroups
        INNER JOIN Prefectures
          ON StationGroups.prefCode = Prefectures.code
      )
      SELECT * FROM (
          SELECT 0 AS ord, StationData.* FROM StationData
            WHERE stationName = ?
        UNION ALL
          SELECT 1 AS ord, StationData.* FROM StationData
            WHERE stationName LIKE ? ESCAPE '\\'
        UNION ALL
          SELECT 2 AS ord, StationData.* FROM StationData
            WHERE stationName LIKE ? ESCAPE '\\'
        UNION ALL
          SELECT 3 AS ord, StationData.* FROM StationData
            WHERE stationName LIKE ? ESCAPE '\\'
        UNION ALL
          SELECT 4 AS ord, StationData.* FROM StationData
            WHERE kana = ?
        UNION ALL
          SELECT 5 AS ord, StationData.* FROM StationData
            WHERE kana LIKE ? ESCAPE '\\'
        UNION ALL
          SELECT 6 AS ord, StationData.* FROM StationData
            WHERE kana LIKE ? ESCAPE '\\'
        UNION ALL
          SELECT 7 AS ord, StationData.* FROM StationData
            WHERE kana LIKE ? ESCAPE '\\'
      ) AS Results
      GROUP BY Results.stationGroupCode
      ORDER BY Results.ord
      LIMIT ? OFFSET ?
    `).all(
      name, `${escaped}_%`, `_%${escaped}`, `_%${escaped}_%`,
      name, `${escaped}_%`, `_%${escaped}`, `_%${escaped}_%`,
      len, off
    );
  }

  return data;
};


// 駅グループを名前で検索した際の件数
// /api/searchStationGroupCount
exports.stationGroupCount = async (request, reply) => {
  const name = request.query.name ?? "";
  let data;
  if (name === "") {
    data = db.prepare(`
      SELECT COUNT(*) AS count FROM StationGroups
    `).get();
  } else {
    const escaped = escapeLikePattern(name);
    data = db.prepare(`
      SELECT COUNT(*) AS count FROM StationGroups
        WHERE stationName = ?
          OR stationName LIKE ? ESCAPE '\\'
          OR stationName LIKE ? ESCAPE '\\'
          OR stationName LIKE ? ESCAPE '\\'
          OR kana = ?
          OR kana LIKE ? ESCAPE '\\'
          OR kana LIKE ? ESCAPE '\\'
          OR kana LIKE ? ESCAPE '\\'
    `).get(
      name, `${escaped}_%`, `_%${escaped}`, `_%${escaped}_%`,
      name, `${escaped}_%`, `_%${escaped}`, `_%${escaped}_%`
    );
  }

  return data.count;
};


// 座標から近い駅/駅グループを複数取得
// /api/searchNearestStationGroup
exports.searchKNearestStationGroups = async (request, reply) => {
  const { lat, lng, num } = request.query;
  const data = db.prepare(`
    SELECT
      StationGroups.*,
      Prefectures.code AS prefCode,
      Prefectures.name AS prefName,
      (
        6371 * ACOS(
          COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?))
          + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
        )
      ) AS distance
    FROM StationGroups
    INNER JOIN Prefectures
      ON StationGroups.prefCode = Prefectures.code
    ORDER BY distance
    LIMIT ?
  `).all(lat, lng, lat, num);

  return data;
};



// 都道府県名を取得
// /api/pref/:prefCode
exports.prefecture = async (request, reply) => {
  const prefCode = request.params.prefCode;
  const data = db.prepare(`
    SELECT
      Prefectures.code AS prefCode,
      Prefectures.name AS prefName
    FROM Prefectures
    WHERE code = ?
  `).get(prefCode);

  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};

// 都道府県名を全取得
// /api/pref
exports.prefectures = async (request, reply) => {
  const data = db.prepare(`
    SELECT
      Prefectures.code AS prefCode,
      Prefectures.name AS prefName
    FROM Prefectures
  `).all();

  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};


// 特定の路線のpathデータを取得する(geojson形式)
const get_railway_path_geojson = (railwayCode, properties) => {
  const pathNum = db.prepare(`
    SELECT COUNT(DISTINCT pathId) AS num
    FROM RailPaths
    WHERE railwayCode = ?
  `).get(railwayCode).num;
  const stmt = db.prepare(`
    SELECT latitude, longitude FROM RailPaths
    WHERE railwayCode = ? AND pathId = ?
    ORDER BY ord
  `);
  return {
    type: "Feature",
    geometry: {
      type: "MultiLineString",
      coordinates: [...Array(pathNum).keys()].map(pathId =>
        stmt.all(railwayCode, pathId).map(pos => [pos.longitude, pos.latitude])
      ),
    },
    properties: properties,
  };
};


// 路線の線路のpathを取得
// /api/railpaths/:railwayCode
exports.railPath = async (request, reply) => {
  const railwayCode = request.params.railwayCode;
  const railwayInfo = db.prepare(`
    SELECT
      Railways.*,
      Companies.companyName,
      Companies.formalName AS companyFormalName
    FROM Railways
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
        AND Railways.railwayCode = ?
  `).get(railwayCode);
  const data = get_railway_path_geojson(railwayCode, railwayInfo);

  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};


// 会社に属する全路線の線路のpathを取得
// /api/pathslist/:companyCode
exports.railPathList = async (request, reply) => {
  const companyCode = request.params.companyCode;
  let railwayList;
  if (companyCode === 0) {
    railwayList = db.prepare(`
      SELECT
        Railways.*,
        Companies.companyName,
        Companies.formalName AS companyFormalName
      FROM Railways
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
          AND Railways.companyCode <= ?
    `).all(JR_COMPANY_CODE_MAX);
  } else {
    railwayList = db.prepare(`
      SELECT
        Railways.*,
        Companies.companyName,
        Companies.formalName AS companyFormalName
      FROM Railways
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
          AND Railways.companyCode = ?
    `).all(companyCode);
  }

  const data = railwayList.map(elem =>
    get_railway_path_geojson(elem.railwayCode, elem));

  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};


// 全路線の線路のpathを取得
// /api/allRailPaths
exports.allRailPaths = async (request, reply) => {
  const railwayList = db.prepare(`
    SELECT
      Railways.*,
      Companies.companyName,
      Companies.formalName AS companyFormalName
    FROM Railways
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
  `).all();

  const data = railwayList.map(elem =>
    get_railway_path_geojson(elem.railwayCode, elem));

  reply.header("Cache-Control", CACHE_CONTROL_VALUE);
  return data;
};


// 時刻表と列車走行位置のURLを取得
// /api/timetableURL/:stationCode
exports.timetableURL = async (request, reply) => {
  const stationCode = request.params.stationCode;
  const timetable = db.prepare(`
    SELECT direction, url FROM TimetableLinks
    WHERE stationCode = ?
  `).all(stationCode);
  const trainPos = db.prepare(`
    SELECT url FROM TrainPosLinks
    WHERE stationCode = ?
  `).get(stationCode);

  return {
    timetable: timetable,
    trainPos: trainPos?.url ?? "",
  };
};


// 時刻表のURL追加更新(admin)
// PUT /api/timetableURL
exports.updateTimetableURL = async (request, reply) => {
  const { code, direction, mode, url } = request.body;

  if (mode === "update") {
    db.prepare(`
      INSERT INTO TimetableLinks VALUES(?, ?, ?)
      ON CONFLICT(stationCode, direction)
      DO UPDATE SET url = ?
    `).run(code, direction, url, url);
  } else {
    db.prepare(`
      DELETE FROM TimetableLinks
      WHERE stationCode = ? AND direction = ?
    `).run(code, direction);
  }

  return reply.send("OK");
};


// 列車走行位置のURL追加更新(admin)
// PUT /api/trainPosURL
exports.updateTrainPosURL = async (request, reply) => {
  const { code, url } = request.body;

  db.prepare(`
    UPDATE TrainPosLinks SET url = ?
    WHERE stationCode = ?
  `).run(url, code);

  return reply.send("OK");
};


// 時刻表と走行位置のURLのexport(admin)
// POST /api/exportStationURL
exports.exportStationURL = async (request, reply) => {
  const data = export_stationURL(db);
  return data;
};


// 時刻表と走行位置のURLのimport(admin)
// POST /api/importStationURL
exports.importStationURL = async (request, reply) => {
  const data = request.body;
  import_stationURL(db, data);
  return reply.send("OK");
};
