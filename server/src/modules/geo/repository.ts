import { db } from "../../db/connection";
import { JR_COMPANY_CODE_MAX } from "../../constants";
import type { GeoJSONFeature } from "../../types";

export const buildRailwayPathGeoJSON = (
  railwayCode: number,
  properties: Record<string, unknown>,
): GeoJSONFeature => {
  const pathNum = db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(DISTINCT pathId) AS num
    FROM RailPaths
    WHERE railwayCode = ?
  `).get(railwayCode)!.num;

  const stmt = db.prepare<unknown[], { longitude: number; latitude: number }>(`
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
    properties,
  };
};

export const findRailwayWithCompany = (railwayCode: number) => {
  return db.prepare<unknown[], Record<string, unknown>>(`
    SELECT
      Railways.*,
      Companies.companyName,
      Companies.formalName AS companyFormalName
    FROM Railways
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
        AND Railways.railwayCode = ?
  `).get(railwayCode)!;
};

export const findRailwayListByCompanyCode = (companyCode: number) => {
  if (companyCode === 0) {
    return db.prepare<unknown[], Record<string, unknown> & { railwayCode: number }>(`
      SELECT
        Railways.*,
        Companies.companyName,
        Companies.formalName AS companyFormalName
      FROM Railways
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
          AND Railways.companyCode <= ?
    `).all(JR_COMPANY_CODE_MAX);
  }
  return db.prepare<unknown[], Record<string, unknown> & { railwayCode: number }>(`
    SELECT
      Railways.*,
      Companies.companyName,
      Companies.formalName AS companyFormalName
    FROM Railways
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
        AND Railways.companyCode = ?
  `).all(companyCode);
};

export const findAllRailwayList = () => {
  return db.prepare<unknown[], Record<string, unknown> & { railwayCode: number }>(`
    SELECT
      Railways.*,
      Companies.companyName,
      Companies.formalName AS companyFormalName
    FROM Railways
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
  `).all();
};
