import { db, getOrThrow } from "../../db/connection";
import type { StationDetail } from "../../types";

export const findStationByCode = (stationCode: number) => {
  const stmt = db.prepare<[number], StationDetail>(`
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
  `);
  return getOrThrow(stmt, stationCode);
};

export const findStationGroupByCode = (stationGroupCode: number) => {
  const stmt = db.prepare(`
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
  `);
  return getOrThrow(stmt, stationGroupCode);
};

export const findStationsByGroupCode = (stationGroupCode: number) => {
  return db.prepare<[number], Omit<StationDetail, "prefCode" | "prefName">>(`
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
};
