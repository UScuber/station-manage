const { db } = require("../db/connection");
const { convert_date, insert_next_stations, attachVisitType, escapeLikePattern } = require("../components/lib");
const { RecordState } = require("../constants");
const { export_sql } = require("../components/export-sql");
const { import_sql, check_json_format } = require("../components/import-sql");


// 駅の最新のアクセス日時を取得
// /api/latestStationHistory/:stationCode
exports.latestStationHistory = async (request, reply) => {
  const stationCode = request.params.stationCode;
  const userId = request.userId;

  const stmt = db.prepare(`
    SELECT date FROM LatestStationHistory
    WHERE stationCode = ? AND state = ? AND userId = ?
  `);
  return {
    getDate: stmt.get(stationCode, RecordState.Get, userId)?.date ?? null,
    passDate: stmt.get(stationCode, RecordState.Pass, userId)?.date ?? null,
  };
};


// 路線に属する駅の最新のアクセス日時を取得
// /api/latestRailwayStationHistory/:railwayCode
exports.latestStationHistoryList = async (request, reply) => {
  const railwayCode = request.params.railwayCode;
  const userId = request.userId;

  const stmt = db.prepare(`
    SELECT date FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
        AND Stations.railwayCode = ?
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.state = ?
        AND LatestStationHistory.userId = ?
  `);
  const getList = stmt.all(railwayCode, RecordState.Get, userId);
  const passList = stmt.all(railwayCode, RecordState.Pass, userId);
  return getList.map((getDate, idx) => ({
    getDate: getDate.date ?? null,
    passDate: passList[idx].date ?? null,
  }));
};


// 駅グループの最新のアクセス日時を取得
// /api/latestStationGroupHistory/:stationGroupCode
exports.latestStationGroupHistory = async (request, reply) => {
  const stationGroupCode = request.params.stationGroupCode;
  const userId = request.userId;

  const stmt = db.prepare(`
    SELECT date FROM LatestStationGroupHistory
    WHERE stationGroupCode = ? AND userId = ?
  `);
  return {
    date: stmt.get(stationGroupCode, userId)?.date ?? null,
  };
};


const buildHistoryFilter = (query, userId) => {
  const name = query.name ?? "";
  const type = query.type;
  const convertedFrom = convert_date(query.dateFrom);
  const convertedTo = convert_date(query.dateTo);
  const dateFrom = convertedFrom ? convertedFrom.substr(0, 10) + " 00:00:00" : undefined;
  const dateTo = convertedTo ? convertedTo.substr(0, 10) + " 23:59:59" : undefined;

  let nameCondition = "";
  const nameParams = [];

  if (type === "station" && name !== "") {
    nameCondition = "AND StationGroups.stationName = ?";
    nameParams.push(name);
  } else if (type === "railway" && name !== "") {
    nameCondition = "AND Railways.railwayName = ?";
    nameParams.push(name);
  } else if (type === "company" && name !== "") {
    nameCondition = "AND Companies.companyName = ?";
    nameParams.push(name);
  }

  return { nameCondition, params: [userId, dateFrom, dateTo, ...nameParams] };
};


// 全体の乗降/通過の履歴を区間取得
// /api/stationHistory
exports.stationHistoryList = async (request, reply) => {
  const off = request.query.off;
  const len = request.query.len;
  const userId = request.userId;
  const { nameCondition, params } = buildHistoryFilter(request.query, userId);

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
      Companies.companyName AS railwayCompany,
      StationHistory.date,
      StationHistory.state
    FROM StationHistory
    INNER JOIN Stations
      ON StationHistory.stationCode = Stations.stationCode
        AND StationHistory.userId = ?
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
    INNER JOIN Prefectures
      ON StationGroups.prefCode = Prefectures.code
    WHERE StationHistory.date >= datetime(IFNULL(?, '0000-01-01 00:00:00'))
      AND StationHistory.date <= datetime(IFNULL(?, '9999-12-31 23:59:59'))
      ${nameCondition}
    ORDER BY StationHistory.date DESC
    LIMIT ?
    OFFSET ?
  `).all(...params, len, off);

  data = data.map(station => insert_next_stations(station, station.stationCode));
  return data;
};


// 全体の乗降/通過の履歴の個数を取得
// /api/stationHistoryCount
exports.stationHistoryCount = async (request, reply) => {
  const userId = request.userId;
  const { nameCondition, params } = buildHistoryFilter(request.query, userId);

  const data = db.prepare(`
    SELECT COUNT(*) AS count FROM StationHistory
    INNER JOIN Stations
      ON StationHistory.stationCode = Stations.stationCode
        AND StationHistory.userId = ?
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
    INNER JOIN Prefectures
      ON StationGroups.prefCode = Prefectures.code
    WHERE StationHistory.date >= datetime(IFNULL(?, '0000-01-01 00:00:00'))
      AND StationHistory.date <= datetime(IFNULL(?, '9999-12-31 23:59:59'))
      ${nameCondition}
  `).get(...params);
  return data.count;
};


// 駅情報を付与した履歴を取得
// /api/stationHistoryAndInfo
exports.stationHistoryDetail = async (request, reply) => {
  const userId = request.userId;

  let data = db.prepare(`
    SELECT
      StationHistory.date,
      StationHistory.state,
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
    FROM StationHistory
    INNER JOIN Stations
      ON StationHistory.stationCode = Stations.stationCode
        AND StationHistory.userId = ?
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
    INNER JOIN Prefectures
      ON StationGroups.prefCode = Prefectures.code
    ORDER BY date DESC
  `).all(userId);

  data = data.map(station => insert_next_stations(station, station.stationCode));
  data = attachVisitType(data, userId);
  return data;
};


// 駅の履歴を取得
// /api/stationHistory/:stationCode
exports.stationHistory = async (request, reply) => {
  const stationCode = request.params.stationCode;
  const userId = request.userId;

  return db.prepare(`
    SELECT stationCode, date, state FROM StationHistory
    WHERE stationCode = ? AND userId = ?
    ORDER BY date DESC
  `).all(stationCode, userId);
};


// 駅グループ全体の履歴を取得(各駅の行動も含める)
// /api/stationGroupHistory/:stationGroupCode
exports.stationGroupHistory = async (request, reply) => {
  const stationGroupCode = request.params.stationGroupCode;
  const userId = request.userId;

  return db.prepare(`
      SELECT
      StationGroupHistory.stationGroupCode,
        StationGroupHistory.date,
        ${RecordState.GroupVisit} AS state,
        '' AS railwayName,
        '' AS railwayColor,
        NULL AS stationCode
      FROM StationGroupHistory
      WHERE stationGroupCode = ? AND userId = ?
    UNION ALL
      SELECT
        Stations.stationGroupCode,
        StationHistory.date,
        StationHistory.state,
        Railways.railwayName,
        Railways.railwayColor,
        StationHistory.stationCode
      FROM StationHistory
      INNER JOIN Stations
        ON StationHistory.stationCode = Stations.stationCode
          AND Stations.stationGroupCode = ?
          AND StationHistory.userId = ?
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
    ORDER BY date DESC
  `).all(stationGroupCode, userId, stationGroupCode, userId);
};


// 駅グループを名前で検索、区間指定した時のグループの最新の履歴
// /api/searchStationGroupListHistory
exports.latestStationGroupHistoryList = async (request, reply) => {
  const off = request.query.off;
  const len = request.query.len;
  const name = request.query.name ?? "";
  const userId = request.userId;

  let data;
  if (name === "") {
    data = db.prepare(`
      SELECT StationGroups.*, LatestStationGroupHistory.date, 0 AS ord FROM StationGroups
      LEFT JOIN LatestStationGroupHistory
        ON StationGroups.stationGroupCode = LatestStationGroupHistory.stationGroupCode
          AND LatestStationGroupHistory.userId = ?
      LIMIT ? OFFSET ?
    `).all(userId, len, off);
  } else {
    const escaped = escapeLikePattern(name);
    data = db.prepare(`
      WITH StationData AS (
        SELECT * FROM StationGroups
      )
      SELECT Results.*, LatestStationGroupHistory.date FROM (
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
      LEFT JOIN LatestStationGroupHistory
        ON Results.stationGroupCode = LatestStationGroupHistory.stationGroupCode
          AND LatestStationGroupHistory.userId = ?
      GROUP BY Results.stationGroupCode
      ORDER BY Results.ord
      LIMIT ? OFFSET ?
    `).all(
      name, `${escaped}_%`, `_%${escaped}`, `_%${escaped}_%`,
      name, `${escaped}_%`, `_%${escaped}`, `_%${escaped}_%`,
      userId, len, off
    );
  }

  return data;
};


// 乗降/通過の情報を追加
// POST /api/stationDate
const insertStationDate = db.transaction((code, date, state, userId) => {
  db.prepare(
    "INSERT INTO StationHistory VALUES(?, datetime(?), ?, ?)"
  ).run(code, date, state, userId);

  db.prepare(`
    INSERT INTO LatestStationHistory VALUES(?, datetime(?), ?, ?)
    ON CONFLICT(stationCode, state, userId)
    DO UPDATE SET date = MAX(IFNULL(date, 0), datetime(?))
  `).run(code, date, state, userId, date);
});

exports.postStationDate = async (request, reply) => {
  const { code, date, state } = request.body;
  const userId = request.userId;
  insertStationDate(code, date, state, userId);
  return reply.send("OK");
};


// 立ち寄りの情報を追加
// POST /api/stationGroupDate
const insertStationGroupDate = db.transaction((code, date, userId) => {
  db.prepare(`
    INSERT INTO StationGroupHistory VALUES(?, datetime(?), ?)
  `).run(code, date, userId);

  const cnt = db.prepare(`
    SELECT COUNT(*) AS cnt FROM LatestStationGroupHistory
    WHERE stationGroupCode = ? AND userId = ?
  `).get(code, userId).cnt;

  if (cnt) {
    db.prepare(`
      UPDATE LatestStationGroupHistory SET date = MAX(IFNULL(date, 0), datetime(?))
      WHERE stationGroupCode = ? AND userId = ?
    `).run(date, code, userId);
  } else {
    db.prepare(`
      INSERT INTO LatestStationGroupHistory VALUES(?, datetime(?), ?)
    `).run(code, date, userId);
  }
});

exports.postStationGroupDate = async (request, reply) => {
  const { code, date } = request.body;
  const userId = request.userId;
  insertStationGroupDate(code, date, userId);
  return reply.send("OK");
};


// 乗降/通過の履歴を削除
// DELETE /api/stationDate
const removeStationDate = db.transaction((code, date, state, userId) => {
  db.prepare(`
    DELETE FROM StationHistory
    WHERE stationCode = ? AND date = datetime(?) AND state = ? AND userId = ?
  `).run(code, date, state, userId);

  // 要素が何もなければNULLが入る
  db.prepare(`
    UPDATE LatestStationHistory SET date = (
      SELECT MAX(date) FROM StationHistory
      WHERE stationCode = ? AND state = ? AND userId = ?
    )
    WHERE stationCode = ? AND state = ? AND userId = ?
  `).run(code, state, userId, code, state, userId);
});

exports.deleteStationDate = async (request, reply) => {
  const { code, date, state } = request.body;
  const userId = request.userId;
  removeStationDate(code, date, state, userId);
  return reply.send("OK");
};


// 立ち寄りの履歴を削除
// DELETE /api/stationGroupDate
const removeStationGroupDate = db.transaction((code, date, userId) => {
  db.prepare(`
    DELETE FROM StationGroupHistory
    WHERE stationGroupCode = ? AND date = datetime(?) AND userId = ?
  `).run(code, date, userId);

  // 要素が何もなければNULLが入る
  db.prepare(`
    UPDATE LatestStationGroupHistory SET date = (
      SELECT MAX(date) FROM StationGroupHistory
      WHERE stationGroupCode = ? AND userId = ?
    )
    WHERE stationGroupCode = ? AND userId = ?
  `).run(code, userId, code, userId);
});

exports.deleteStationGroupDate = async (request, reply) => {
  const { code, date } = request.body;
  const userId = request.userId;
  removeStationGroupDate(code, date, userId);
  return reply.send("OK");
};


// 履歴のエクスポート
// POST /api/exportHistory
exports.exportHistory = async (request, reply) => {
  const userId = request.userId;
  return export_sql(db, userId);
};


// 履歴のインポート
// POST /api/importHistory
exports.importHistory = async (request, reply) => {
  const userId = request.userId;
  const data = request.body;
  if (!check_json_format(data)) {
    return reply.code(400).send({ error: "Invalid input" });
  }
  import_sql(db, data, userId);
  return reply.send("OK");
};
