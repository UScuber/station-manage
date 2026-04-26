import type Database from "better-sqlite3";
import { db } from "../../db/connection";
import { RecordState } from "../../constants";
import { escapeLikePattern } from "../../shared/sql";
import { convertDate } from "../../shared/date";
import type { StationHistoryDetail } from "../../types";
import type { HistoryFilterQuery } from "./schema";

export const findLatestStationHistory = (
  stationCode: number,
  userId: string,
) => {
  const stmt = db.prepare<[number, number, string], { date: string }>(`
    SELECT date FROM LatestStationHistory
    WHERE stationCode = ? AND state = ? AND userId = ?
  `);
  return {
    getDate: stmt.get(stationCode, RecordState.Get, userId)?.date ?? null,
    passDate: stmt.get(stationCode, RecordState.Pass, userId)?.date ?? null,
  };
};

export const findLatestStationHistoryByRailway = (
  railwayCode: number,
  userId: string,
) => {
  return db
    .prepare<
      [number, number, string, number, string],
      { getDate: string | null; passDate: string | null }
    >(
      `
    SELECT
      GetHistory.date AS getDate,
      PassHistory.date AS passDate
    FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
        AND Stations.railwayCode = ?
    LEFT JOIN LatestStationHistory AS GetHistory
      ON Stations.stationCode = GetHistory.stationCode
        AND GetHistory.state = ?
        AND GetHistory.userId = ?
    LEFT JOIN LatestStationHistory AS PassHistory
      ON Stations.stationCode = PassHistory.stationCode
        AND PassHistory.state = ?
        AND PassHistory.userId = ?
    ORDER BY Stations.stationCode
  `,
    )
    .all(railwayCode, RecordState.Get, userId, RecordState.Pass, userId);
};

export const findLatestStationGroupHistory = (
  stationGroupCode: number,
  userId: string,
) => {
  const stmt = db.prepare<[number, string], { date: string }>(`
    SELECT date FROM LatestStationGroupHistory
    WHERE stationGroupCode = ? AND userId = ?
  `);
  return {
    date: stmt.get(stationGroupCode, userId)?.date ?? null,
  };
};

type HistoryFilterResult = {
  nameCondition: string;
  params: [userId: string, dateFrom: string, dateTo: string, ...name: string[]];
};

const buildHistoryFilter = (
  query: HistoryFilterQuery,
  userId: string,
): HistoryFilterResult => {
  const name = query.name ?? "";
  const type = query.type;
  const dateFrom = query.dateFrom
    ? convertDate(query.dateFrom).substring(0, 10) + " 00:00:00"
    : "0000-01-01 00:00:00";
  const dateTo = query.dateTo
    ? convertDate(query.dateTo).substring(0, 10) + " 23:59:59"
    : "9999-12-31 23:59:59";

  const base = [userId, dateFrom, dateTo] as const;

  if (type === "station" && name !== "") {
    return {
      nameCondition: "AND StationGroups.stationName = ?",
      params: [...base, name],
    };
  }
  if (type === "railway" && name !== "") {
    return {
      nameCondition: "AND Railways.railwayName = ?",
      params: [...base, name],
    };
  }
  if (type === "company" && name !== "") {
    return {
      nameCondition: "AND Companies.companyName = ?",
      params: [...base, name],
    };
  }
  return { nameCondition: "", params: [...base] };
};

export const findStationHistoryList = (
  query: HistoryFilterQuery,
  userId: string,
  off: number,
  len: number,
) => {
  const { nameCondition, params } = buildHistoryFilter(query, userId);
  return db
    .prepare<[...typeof params, number, number], StationHistoryDetail>(
      `
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
    WHERE StationHistory.date >= datetime(?)
      AND StationHistory.date <= datetime(?)
      ${nameCondition}
    ORDER BY StationHistory.date DESC
    LIMIT ?
    OFFSET ?
  `,
    )
    .all(...params, len, off);
};

export const countStationHistory = (
  query: HistoryFilterQuery,
  userId: string,
) => {
  const { nameCondition, params } = buildHistoryFilter(query, userId);
  return db
    .prepare<typeof params, { count: number }>(
      `
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
    WHERE StationHistory.date >= datetime(?)
      AND StationHistory.date <= datetime(?)
      ${nameCondition}
  `,
    )
    .get(...params)!.count;
};

export const findStationHistoryDetail = (userId: string) => {
  return db
    .prepare<[string], StationHistoryDetail>(
      `
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
  `,
    )
    .all(userId);
};

export const findStationHistoryByCode = (
  stationCode: number,
  userId: string,
) => {
  return db
    .prepare(
      `
    SELECT stationCode, date, state FROM StationHistory
    WHERE stationCode = ? AND userId = ?
    ORDER BY date DESC
  `,
    )
    .all(stationCode, userId);
};

export const findStationGroupHistoryByCode = (
  stationGroupCode: number,
  userId: string,
) => {
  return db
    .prepare(
      `
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
  `,
    )
    .all(stationGroupCode, userId, stationGroupCode, userId);
};

export const searchStationGroupHistoryList = (
  name: string,
  userId: string,
  off: number,
  len: number,
) => {
  if (name === "") {
    return db
      .prepare(
        `
      SELECT StationGroups.*, LatestStationGroupHistory.date, 0 AS ord FROM StationGroups
      LEFT JOIN LatestStationGroupHistory
        ON StationGroups.stationGroupCode = LatestStationGroupHistory.stationGroupCode
          AND LatestStationGroupHistory.userId = ?
      LIMIT ? OFFSET ?
    `,
      )
      .all(userId, len, off);
  }

  const escaped = escapeLikePattern(name);
  return db
    .prepare(
      `
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
  `,
    )
    .all(
      name,
      `${escaped}_%`,
      `_%${escaped}`,
      `_%${escaped}_%`,
      name,
      `${escaped}_%`,
      `_%${escaped}`,
      `_%${escaped}_%`,
      userId,
      len,
      off,
    );
};

// --- Transactions ---

export const insertStationDate: Database.Transaction<
  (code: number, date: string, state: number, userId: string) => void
> = db.transaction(
  (code: number, date: string, state: number, userId: string) => {
    db.prepare("INSERT INTO StationHistory VALUES(?, datetime(?), ?, ?)").run(
      code,
      date,
      state,
      userId,
    );

    db.prepare(
      `
      INSERT INTO LatestStationHistory VALUES(?, datetime(?), ?, ?)
      ON CONFLICT(stationCode, state, userId)
      DO UPDATE SET date = MAX(IFNULL(date, 0), datetime(?))
    `,
    ).run(code, date, state, userId, date);
  },
);

export const insertStationGroupDate: Database.Transaction<
  (code: number, date: string, userId: string) => void
> = db.transaction((code: number, date: string, userId: string) => {
  db.prepare(
    `
      INSERT INTO StationGroupHistory VALUES(?, datetime(?), ?)
    `,
  ).run(code, date, userId);

  db.prepare(
    `
      INSERT INTO LatestStationGroupHistory VALUES(?, datetime(?), ?)
      ON CONFLICT(stationGroupCode, userId)
      DO UPDATE SET date = MAX(IFNULL(date, 0), datetime(?))
    `,
  ).run(code, date, userId, date);
});

export const removeStationDate: Database.Transaction<
  (code: number, date: string, state: number, userId: string) => void
> = db.transaction(
  (code: number, date: string, state: number, userId: string) => {
    db.prepare(
      `
      DELETE FROM StationHistory
      WHERE stationCode = ? AND date = datetime(?) AND state = ? AND userId = ?
    `,
    ).run(code, date, state, userId);

    db.prepare(
      `
      UPDATE LatestStationHistory SET date = (
        SELECT MAX(date) FROM StationHistory
        WHERE stationCode = ? AND state = ? AND userId = ?
      )
      WHERE stationCode = ? AND state = ? AND userId = ?
    `,
    ).run(code, state, userId, code, state, userId);
  },
);

export const removeStationGroupDate: Database.Transaction<
  (code: number, date: string, userId: string) => void
> = db.transaction((code: number, date: string, userId: string) => {
  db.prepare(
    `
      DELETE FROM StationGroupHistory
      WHERE stationGroupCode = ? AND date = datetime(?) AND userId = ?
    `,
  ).run(code, date, userId);

  db.prepare(
    `
      UPDATE LatestStationGroupHistory SET date = (
        SELECT MAX(date) FROM StationGroupHistory
        WHERE stationGroupCode = ? AND userId = ?
      )
      WHERE stationGroupCode = ? AND userId = ?
    `,
  ).run(code, userId, code, userId);
});
