import { db } from "../../db/connection";
import type { StationDetail } from "../../types";

export const findPrefectureByCode = (prefCode: number) => {
  return db.prepare(`
    SELECT
      Prefectures.code AS prefCode,
      Prefectures.name AS prefName
    FROM Prefectures
    WHERE code = ?
  `).get(prefCode);
};

export const findAllPrefectures = () => {
  return db.prepare(`
    SELECT
      Prefectures.code AS prefCode,
      Prefectures.name AS prefName
    FROM Prefectures
  `).all();
};

export const findRailwaysByPrefCode = (prefCode: number) => {
  return db.prepare(`
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
};

export const findStationsByPrefCode = (prefCode: number) => {
  return db.prepare<[number], StationDetail & { formalName: string; railwayKana: string }>(`
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
};
