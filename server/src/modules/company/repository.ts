import { db } from "../../db/connection";
import { JR_COMPANY_CODE_MAX } from "../../constants";

export const findCompanyByCode = (companyCode: number) => {
  if (companyCode === 0) {
    return {
      companyCode: 0,
      companyName: "JR",
      formalName: "JR",
    };
  }
  return db.prepare(`
    SELECT * FROM Companies
    WHERE companyCode = ?
  `).get(companyCode);
};

export const findAllCompanies = () => {
  return db.prepare(`
    SELECT * FROM Companies
    ORDER BY companyCode
  `).all();
};

export const findRailwaysByCompanyCode = (companyCode: number) => {
  if (companyCode === 0) {
    return db.prepare(`
      SELECT * FROM Railways
      WHERE companyCode <= ?
      ORDER BY railwayCode
    `).all(JR_COMPANY_CODE_MAX);
  }
  return db.prepare(`
    SELECT * FROM Railways
    WHERE companyCode = ?
    ORDER BY railwayCode
  `).all(companyCode);
};

export const findStationsByCompanyCode = (companyCode: number) => {
  if (companyCode === 0) {
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
  }
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
};
