import type { DatabaseInstance } from "../../db/connection";
import type {
  ExportStationHistory,
  ExportStationHistoryInfo,
  ExportStationGroupHistory,
  ExportStationGroupHistoryInfo,
} from "../../types";

interface StationHistoryRow extends ExportStationHistoryInfo {
  stationCode: number;
  date: string;
  state: number;
}

interface StationGroupHistoryRow extends ExportStationGroupHistoryInfo {
  stationGroupCode: number;
  date: string;
}

// 履歴を出力する
export const exportHistory = (db: DatabaseInstance, userId: string) => {
  const stationRows = db
    .prepare<[string], StationHistoryRow>(
      `
    SELECT
      StationHistory.date,
      StationHistory.state,
      Stations.stationCode,
      Stations.stationGroupCode,
      Stations.railwayCode,
      Stations.latitude,
      Stations.longitude,
      StationGroups.stationName,
      Railways.railwayName,
      Companies.companyName
    FROM StationHistory
    INNER JOIN Stations
      ON StationHistory.stationCode = Stations.stationCode
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
    WHERE StationHistory.userId = ?
    ORDER BY Stations.stationCode
  `,
    )
    .all(userId);

  const stationMap = new Map<number, ExportStationHistory>();
  for (const row of stationRows) {
    const existing = stationMap.get(row.stationCode);
    if (existing) {
      existing.history.push({ date: row.date, state: row.state });
    } else {
      stationMap.set(row.stationCode, {
        history: [{ date: row.date, state: row.state }],
        info: {
          stationGroupCode: row.stationGroupCode,
          railwayCode: row.railwayCode,
          latitude: row.latitude,
          longitude: row.longitude,
          stationName: row.stationName,
          railwayName: row.railwayName,
          companyName: row.companyName,
        },
      });
    }
  }
  const station_history = [...stationMap.values()];

  const groupRows = db
    .prepare<[string], StationGroupHistoryRow>(
      `
    SELECT
      StationGroupHistory.date,
      StationGroups.stationGroupCode,
      StationGroups.stationName,
      StationGroups.kana,
      StationGroups.latitude,
      StationGroups.longitude,
      StationGroups.prefCode
    FROM StationGroupHistory
    INNER JOIN StationGroups
      ON StationGroupHistory.stationGroupCode = StationGroups.stationGroupCode
    WHERE StationGroupHistory.userId = ?
    ORDER BY StationGroups.stationGroupCode
  `,
    )
    .all(userId);

  const groupMap = new Map<number, ExportStationGroupHistory>();
  for (const row of groupRows) {
    const existing = groupMap.get(row.stationGroupCode);
    if (existing) {
      existing.history.push({ date: row.date });
    } else {
      groupMap.set(row.stationGroupCode, {
        history: [{ date: row.date }],
        info: {
          stationName: row.stationName,
          kana: row.kana,
          latitude: row.latitude,
          longitude: row.longitude,
          prefCode: row.prefCode,
        },
      });
    }
  }
  const station_group_history = [...groupMap.values()];

  return { station_history, station_group_history };
};

// 駅の情報のURLを出力する
export const exportStationURL = (db: DatabaseInstance) => {
  const timetableRows = db
    .prepare<[], { stationCode: number; direction: string; url: string }>(
      `
    SELECT Stations.stationCode, TimetableLinks.direction, TimetableLinks.url
    FROM Stations
    INNER JOIN TimetableLinks ON Stations.stationCode = TimetableLinks.stationCode
  `,
    )
    .all();

  const timetableMap = new Map<number, { direction: string; url: string }[]>();
  for (const row of timetableRows) {
    if (!timetableMap.has(row.stationCode))
      timetableMap.set(row.stationCode, []);
    timetableMap
      .get(row.stationCode)!
      .push({ direction: row.direction, url: row.url });
  }

  const trainPosRows = db
    .prepare<[], { stationCode: number; url: string }>(
      `
    SELECT stationCode, url FROM TrainPosLinks
  `,
    )
    .all();

  const trainPosMap = new Map<number, string>();
  for (const row of trainPosRows) {
    trainPosMap.set(row.stationCode, row.url);
  }

  const stations = db
    .prepare<[], { stationCode: number }>("SELECT stationCode FROM Stations")
    .all();

  const data = stations.map((station) => ({
    stationCode: station.stationCode,
    timetable: timetableMap.get(station.stationCode) ?? [],
    trainPosURL: trainPosMap.get(station.stationCode) ?? null,
  }));

  return { data };
};
