import { db } from "../../db/connection";

// --- Railway Progress ---

export const countStationsByRailway = (railwayCode: number) => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(*) AS num FROM Stations
    WHERE railwayCode = ?
  `).get(railwayCode)!.num;
};

export const countVisitedStationsByRailway = (railwayCode: number, userId: string) => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
        AND Stations.railwayCode = ?
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.userId = ?
  `).get(railwayCode, userId)!.num;
};

export const countStationsGroupedByRailway = (companyCode: number) => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(*) as num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
        AND Railways.companyCode = ?
    GROUP BY Stations.railwayCode
    ORDER BY Stations.railwayCode
  `).all(companyCode);
};

export const countVisitedStationsGroupedByRailway = (companyCode: number, userId: string) => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
        AND Railways.companyCode = ?
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.userId = ?
    GROUP BY Stations.railwayCode
    ORDER BY Stations.railwayCode
  `).all(companyCode, userId);
};

export const countStationsGroupedByRailwayForPref = (prefCode: number) => {
  return db.prepare<unknown[], { num: number }>(`
    WITH RailData AS (
      SELECT Stations.railwayCode FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND StationGroups.prefCode = ?
      GROUP BY Stations.railwayCode
    )
    SELECT COUNT(*) AS num FROM Stations
    INNER JOIN RailData
      ON Stations.railwayCode = RailData.railwayCode
    GROUP BY Stations.railwayCode
    ORDER BY Stations.railwayCode
  `).all(prefCode);
};

export const countVisitedStationsGroupedByRailwayForPref = (prefCode: number, userId: string) => {
  return db.prepare<unknown[], { num: number }>(`
    WITH RailData AS (
      SELECT Stations.railwayCode FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND StationGroups.prefCode = ?
      GROUP BY Stations.railwayCode
    )
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN RailData
      ON Stations.railwayCode = RailData.railwayCode
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.userId = ?
    GROUP BY Stations.railwayCode
    ORDER BY Stations.railwayCode
  `).all(prefCode, userId);
};

export const countAllStationsGroupedByRailway = () => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(*) as num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    GROUP BY Stations.railwayCode
    ORDER BY Stations.railwayCode
  `).all();
};

export const countAllVisitedStationsGroupedByRailway = (userId: string) => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.userId = ?
    GROUP BY Stations.railwayCode
    ORDER BY Stations.railwayCode
  `).all(userId);
};

// --- Company Progress ---

export const countStationsByCompany = (companyCode: number) => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(*) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
        AND Railways.companyCode = ?
  `).get(companyCode)!.num;
};

export const countVisitedStationsByCompany = (companyCode: number, userId: string) => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
        AND Railways.companyCode = ?
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.userId = ?
  `).get(companyCode, userId)!.num;
};

export const countAllStationsGroupedByCompany = () => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(*) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    GROUP BY Railways.companyCode
    ORDER BY Railways.companyCode
  `).all();
};

export const countAllVisitedStationsGroupedByCompany = (userId: string) => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.userId = ?
    GROUP BY Railways.companyCode
    ORDER BY Railways.companyCode
  `).all(userId);
};

// --- Prefecture Progress ---

export const countStationsByPref = (prefCode: number) => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(*) AS num FROM Stations
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
        AND StationGroups.prefCode = ?
  `).get(prefCode)!.num;
};

export const countVisitedStationsByPref = (prefCode: number, userId: string) => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
        AND StationGroups.prefCode = ?
    LEFT JOIN LatestStationHistory
      ON LatestStationHistory.stationCode = Stations.stationCode
        AND LatestStationHistory.userId = ?
  `).get(prefCode, userId)!.num;
};

export const countAllStationsGroupedByPref = () => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(*) AS num FROM Stations
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
    GROUP BY StationGroups.prefCode
    ORDER BY StationGroups.prefCode
  `).all();
};

export const countAllVisitedStationsGroupedByPref = (userId: string) => {
  return db.prepare<unknown[], { num: number }>(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
    LEFT JOIN LatestStationHistory
      ON LatestStationHistory.stationCode = Stations.stationCode
        AND LatestStationHistory.userId = ?
    GROUP BY StationGroups.prefCode
    ORDER BY StationGroups.prefCode
  `).all(userId);
};
