import { db } from "../../db/connection";
import { escapeLikePattern } from "../../shared/sql";

export const searchStationGroups = (name: string, off: number, len: number) => {
  if (name === "") {
    return db.prepare(`
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
  }

  const escaped = escapeLikePattern(name);
  return db.prepare(`
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
    len, off,
  );
};

export const countStationGroups = (name: string): number => {
  if (name === "") {
    return db.prepare<[], { count: number }>(`
      SELECT COUNT(*) AS count FROM StationGroups
    `).get()!.count;
  }

  const escaped = escapeLikePattern(name);
  return db.prepare<[string, string, string, string, string, string, string, string], { count: number }>(`
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
    name, `${escaped}_%`, `_%${escaped}`, `_%${escaped}_%`,
  )!.count;
};

export const findNearestStationGroups = (lat: number, lng: number, num: number) => {
  return db.prepare(`
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
};
