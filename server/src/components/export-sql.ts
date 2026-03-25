import type Database from "better-sqlite3";
import type {
  ExportStationHistory,
  ExportStationHistoryInfo,
  ExportStationGroupHistory,
  ExportStationGroupHistoryInfo,
} from "../types";

interface StationQueryRow extends ExportStationHistoryInfo {
  stationCode: number;
  getDate: string | null;
  passDate: string | null;
}

interface StationGroupQueryRow extends ExportStationGroupHistoryInfo {
  stationGroupCode: number;
}

// 履歴を出力する
export const export_sql = (db: Database.Database, userId: string) => {
  const station_history: ExportStationHistory[] = [];
  const station_group_history: ExportStationGroupHistory[] = [];

  db.transaction(() => {
    const res = db
      .prepare<[string], StationQueryRow>(
        `
      SELECT
        Stations.*,
        StationGroups.stationName,
        Railways.railwayName,
        Companies.companyName
      FROM StationHistory
      INNER JOIN Stations
        ON StationHistory.stationCode = Stations.stationCode
          AND userId = ?
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
      GROUP BY StationHistory.stationCode
    `,
      )
      .all(userId);

    for (const item of res) {
      const history = db
        .prepare<[number, string], { date: string; state: number }>(
          `
        SELECT date, state FROM StationHistory
        WHERE stationCode = ? AND userId = ?
      `,
        )
        .all(item.stationCode, userId);

      const { stationCode: _, getDate: __, passDate: ___, ...info } = item;
      station_history.push({ history, info });
    }
  })();

  db.transaction(() => {
    const res = db
      .prepare<[string], StationGroupQueryRow>(
        `
      SELECT StationGroups.* FROM StationGroupHistory
      INNER JOIN StationGroups
        ON StationGroupHistory.stationGroupCode = StationGroups.stationGroupCode
          AND userId = ?
      GROUP BY StationGroupHistory.stationGroupCode
    `,
      )
      .all(userId);

    for (const item of res) {
      const history = db
        .prepare<[number], { date: string }>(
          `
        SELECT date FROM StationGroupHistory
        WHERE stationGroupCode = ?
      `,
        )
        .all(item.stationGroupCode);

      const { stationGroupCode: _, ...info } = item;
      station_group_history.push({ history, info });
    }
  })();

  return { station_history, station_group_history };
};

// 駅の情報のURLを出力する
export const export_stationURL = (db: Database.Database) => {
  const stations = db
    .prepare<[], { stationCode: number }>(
      `
    SELECT stationCode FROM Stations
  `,
    )
    .all();
  const data = stations.map((station) => ({
    stationCode: station.stationCode,
    timetable: db
      .prepare<[number], { direction: string; url: string }>(
        `
        SELECT direction, url FROM TimetableLinks
        WHERE stationCode = ?
      `,
      )
      .all(station.stationCode),
    trainPosURL:
      (
        db
          .prepare<[number], { url: string }>(
            `
        SELECT url FROM TrainPosLinks
        WHERE stationCode = ?
      `,
          )
          .get(station.stationCode)
      )?.url ?? null,
  }));
  return {
    data: data,
  };
};
