import { db } from "../../db/connection";
import { JR_COMPANY_CODE_MAX } from "../../constants";
import type { GeoJSONFeature, RailwayWithCompany } from "../../types";

export const buildRailwayPathGeoJSON = <T extends object>(
  railwayCode: number,
  properties: T,
): GeoJSONFeature<T> => {
  const pathNum = db
    .prepare<[number], { num: number }>(
      `
    SELECT COUNT(DISTINCT pathId) AS num
    FROM RailPaths
    WHERE railwayCode = ?
  `,
    )
    .get(railwayCode)!.num;

  const stmt = db.prepare<[number, number], { longitude: number; latitude: number }>(`
    SELECT latitude, longitude FROM RailPaths
    WHERE railwayCode = ? AND pathId = ?
    ORDER BY ord
  `);

  return {
    type: "Feature",
    geometry: {
      type: "MultiLineString",
      coordinates: [...Array(pathNum).keys()].map((pathId) =>
        stmt
          .all(railwayCode, pathId)
          .map((pos) => [pos.longitude, pos.latitude]),
      ),
    },
    properties,
  };
};

export const findRailwayWithCompany = (railwayCode: number) => {
  return db
    .prepare<[number], RailwayWithCompany>(
      `
    SELECT
      Railways.*,
      Companies.companyName,
      Companies.formalName AS companyFormalName
    FROM Railways
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
        AND Railways.railwayCode = ?
  `,
    )
    .get(railwayCode)!;
};

export const findRailwayListByCompanyCode = (companyCode: number) => {
  if (companyCode === 0) {
    return db
      .prepare<[number], RailwayWithCompany>(
        `
      SELECT
        Railways.*,
        Companies.companyName,
        Companies.formalName AS companyFormalName
      FROM Railways
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
          AND Railways.companyCode <= ?
    `,
      )
      .all(JR_COMPANY_CODE_MAX);
  }
  return db
    .prepare<[number], RailwayWithCompany>(
      `
    SELECT
      Railways.*,
      Companies.companyName,
      Companies.formalName AS companyFormalName
    FROM Railways
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
        AND Railways.companyCode = ?
  `,
    )
    .all(companyCode);
};

export const findAllRailwayList = () => {
  return db
    .prepare<[], RailwayWithCompany>(
      `
    SELECT
      Railways.*,
      Companies.companyName,
      Companies.formalName AS companyFormalName
    FROM Railways
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
  `,
    )
    .all();
};
