import { db } from "../../db/connection";

export const findRailwayByCode = (railwayCode: number) => {
  return db.prepare(`
    SELECT
      Railways.*,
      Companies.companyName,
      Companies.formalName AS companyFormalName
    FROM Railways
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
        AND Railways.railwayCode = ?
  `).get(railwayCode);
};

export const findAllRailways = () => {
  return db.prepare(`
    SELECT
      Railways.*,
      Companies.companyName,
      Companies.formalName AS companyFormalName
    FROM Railways
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
  `).all();
};

export const findStationsByRailwayCode = (railwayCode: number) => {
  return db.prepare<unknown[], Record<string, unknown> & { stationCode: number; stationGroupCode: number }>(`
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
};
