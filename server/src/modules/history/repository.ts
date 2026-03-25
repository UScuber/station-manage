import type Database from "better-sqlite3";
import { db } from "../../db/connection";
import { RecordState } from "../../constants";
import { escapeLikePattern } from "../../shared/sql";
import { convert_date } from "../../shared/date";
import type { HistoryFilterQuery } from "./schema";

export const findLatestStationHistory = (stationCode: number, userId: string) => {
  const stmt = db.prepare<unknown[], { date: string }>(`
    SELECT date FROM LatestStationHistory
    WHERE stationCode = ? AND state = ? AND userId = ?
  `);
  return {
    getDate: stmt.get(stationCode, RecordState.Get, userId)?.date ?? null,
    passDate: stmt.get(stationCode, RecordState.Pass, userId)?.date ?? null,
  };
};

export const findLatestStationHistoryByRailway = (railwayCode: number, userId: string) => {
  const stmt = db.prepare<unknown[], { date: string | null }>(`
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

export const findLatestStationGroupHistory = (stationGroupCode: number, userId: string) => {
  const stmt = db.prepare<unknown[], { date: string }>(`
    SELECT date FROM LatestStationGroupHistory
    WHERE stationGroupCode = ? AND userId = ?
  `);
  return {
    date: stmt.get(stationGroupCode, userId)?.date ?? null,
  };
};

const buildHistoryFilter = (query: HistoryFilterQuery, userId: string) => {
  const name = query.name ?? "";
  const type = query.type;
  const convertedFrom = query.dateFrom ? convert_date(query.dateFrom) : undefined;
  const convertedTo = query.dateTo ? convert_date(query.dateTo) : undefined;
  const dateFrom = convertedFrom ? convertedFrom.substr(0, 10) + " 00:00:00" : undefined;
  const dateTo = convertedTo ? convertedTo.substr(0, 10) + " 23:59:59" : undefined;

  let nameCondition = "";
  const nameParams: string[] = [];

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

export const findStationHistoryList = (
  query: HistoryFilterQuery,
  userId: string,
  off: number,
  len: number,
) => {
  const { nameCondition, params } = buildHistoryFilter(query, userId);
  return db.prepare<unknown[], Record<string, unknown> & { stationCode: number }>(`
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
};

export const countStationHistory = (query: HistoryFilterQuery, userId: string) => {
  const { nameCondition, params } = buildHistoryFilter(query, userId);
  return db.prepare<unknown[], { count: number }>(`
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
  `).get(...params)!.count;
};

export const findStationHistoryDetail = (userId: string) => {
  return db.prepare<unknown[], Record<string, unknown> & { stationCode: number; stationGroupCode: number }>(`
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
};

export const findStationHistoryByCode = (stationCode: number, userId: string) => {
  return db.prepare(`
    SELECT stationCode, date, state FROM StationHistory
    WHERE stationCode = ? AND userId = ?
    ORDER BY date DESC
  `).all(stationCode, userId);
};

export const findStationGroupHistoryByCode = (stationGroupCode: number, userId: string) => {
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

export const searchStationGroupHistoryList = (
  name: string,
  userId: string,
  off: number,
  len: number,
) => {
  if (name === "") {
    return db.prepare(`
      SELECT StationGroups.*, LatestStationGroupHistory.date, 0 AS ord FROM StationGroups
      LEFT JOIN LatestStationGroupHistory
        ON StationGroups.stationGroupCode = LatestStationGroupHistory.stationGroupCode
          AND LatestStationGroupHistory.userId = ?
      LIMIT ? OFFSET ?
    `).all(userId, len, off);
  }

  const escaped = escapeLikePattern(name);
  return db.prepare(`
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
    userId, len, off,
  );
};

// --- Transactions ---

export const insertStationDate: Database.Transaction<(code: number, date: string | undefined, state: number, userId: string) => void> = db.transaction(
  (code: number, date: string | undefined, state: number, userId: string) => {
    db.prepare(
      "INSERT INTO StationHistory VALUES(?, datetime(?), ?, ?)",
    ).run(code, date, state, userId);

    db.prepare(`
      INSERT INTO LatestStationHistory VALUES(?, datetime(?), ?, ?)
      ON CONFLICT(stationCode, state, userId)
      DO UPDATE SET date = MAX(IFNULL(date, 0), datetime(?))
    `).run(code, date, state, userId, date);
  },
);

export const insertStationGroupDate: Database.Transaction<(code: number, date: string | undefined, userId: string) => void> = db.transaction(
  (code: number, date: string | undefined, userId: string) => {
    db.prepare(`
      INSERT INTO StationGroupHistory VALUES(?, datetime(?), ?)
    `).run(code, date, userId);

    const cnt = db.prepare<unknown[], { cnt: number }>(`
      SELECT COUNT(*) AS cnt FROM LatestStationGroupHistory
      WHERE stationGroupCode = ? AND userId = ?
    `).get(code, userId)!.cnt;

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
  },
);

export const removeStationDate: Database.Transaction<(code: number, date: string | undefined, state: number, userId: string) => void> = db.transaction(
  (code: number, date: string | undefined, state: number, userId: string) => {
    db.prepare(`
      DELETE FROM StationHistory
      WHERE stationCode = ? AND date = datetime(?) AND state = ? AND userId = ?
    `).run(code, date, state, userId);

    db.prepare(`
      UPDATE LatestStationHistory SET date = (
        SELECT MAX(date) FROM StationHistory
        WHERE stationCode = ? AND state = ? AND userId = ?
      )
      WHERE stationCode = ? AND state = ? AND userId = ?
    `).run(code, state, userId, code, state, userId);
  },
);

export const removeStationGroupDate: Database.Transaction<(code: number, date: string | undefined, userId: string) => void> = db.transaction(
  (code: number, date: string | undefined, userId: string) => {
    db.prepare(`
      DELETE FROM StationGroupHistory
      WHERE stationGroupCode = ? AND date = datetime(?) AND userId = ?
    `).run(code, date, userId);

    db.prepare(`
      UPDATE LatestStationGroupHistory SET date = (
        SELECT MAX(date) FROM StationGroupHistory
        WHERE stationGroupCode = ? AND userId = ?
      )
      WHERE stationGroupCode = ? AND userId = ?
    `).run(code, userId, code, userId);
  },
);
