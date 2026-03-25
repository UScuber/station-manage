import type Database from "better-sqlite3";
import type { ExportHistoryJSON } from "../types";

interface UnknownHistoryEntry {
  history: { date: string; state?: number }[];
  info: Record<string, unknown>;
  query: string[];
}

interface UnknownHistory {
  station_history: UnknownHistoryEntry[];
  station_group_history: UnknownHistoryEntry[];
}

// 履歴データを取り込む
export const import_sql = (
  db: Database.Database,
  input_json: ExportHistoryJSON,
  userId: string,
): UnknownHistory => {
  // [latitude, longitude]
  const distance = (p1: number[], p2: number[]): number => {
    const R = Math.PI / 180;
    return (
      Math.acos(
        Math.cos(p1[0] * R) *
          Math.cos(p2[0] * R) *
          Math.cos(p2[1] * R - p1[1] * R) +
          Math.sin(p1[0] * R) * Math.sin(p2[0] * R),
      ) * 6371
    );
  };

  db.function("dist", (lat1: number, lng1: number, lat2: number, lng2: number) =>
    distance([lat1, lng1], [lat2, lng2]),
  );

  // 現在の履歴の削除
  db.prepare("DELETE FROM StationHistory WHERE userId = ?").run(userId);
  db.prepare("DELETE FROM StationGroupHistory WHERE userId = ?").run(userId);
  db.prepare("DELETE FROM LatestStationHistory WHERE userId = ?").run(userId);
  db.prepare("DELETE FROM LatestStationGroupHistory WHERE userId = ?").run(
    userId,
  );

  const unknown_history: UnknownHistory = {
    station_history: [],
    station_group_history: [],
  };

  db.transaction(() => {
    input_json.station_history.forEach((data) => {
      const res = db
        .prepare<unknown[], Record<string, unknown>>(
          `
        SELECT * FROM Stations
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
            AND StationGroups.stationName = ?
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
            AND Railways.railwayName = ?
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
            AND Companies.companyName = ?
      `,
        )
        .get(
          String(data.info.stationName),
          String(data.info.railwayName),
          String(data.info.companyName ?? data.info.railwayCompany),
        );
      if (res) {
        data.history.forEach((elem) => {
          db.prepare(
            "INSERT INTO StationHistory VALUES(?, datetime(?), ?, ?)",
          ).run(res.stationCode, elem.date, elem.state, userId);
        });
      } else {
        unknown_history.station_history.push({
          history: data.history,
          info: data.info,
          query: data.history.map(
            (hist) =>
              `postStationDate?state=${hist.state}&date=${hist.date}&code=`,
          ),
        });
      }
    });
  })();

  // stations最終アクセスの更新
  db.prepare(
    `
    INSERT INTO LatestStationHistory(stationCode, date, state, userId)
    SELECT stationCode, MAX(date), state, userId
    FROM StationHistory
    WHERE userId = ?
    GROUP BY stationCode, state
    HAVING MAX(date) IS NOT NULL
  `,
  ).run(userId);

  db.transaction(() => {
    input_json.station_group_history.forEach((data) => {
      // 同じ駅名で、座標が一番近いものを探す
      const res = db
        .prepare<unknown[], { stationGroupCode: number }>(
          `
        SELECT * FROM StationGroups
        WHERE stationName = ? AND dist(latitude,longitude,?,?) = (
          SELECT MIN(dist(latitude,longitude,?,?)) FROM StationGroups
        )
      `,
        )
        .get(
          data.info.stationName,
          data.info.latitude,
          data.info.longitude,
          data.info.latitude,
          data.info.longitude,
        );
      if (res) {
        data.history.forEach((elem) => {
          db.prepare(
            "INSERT INTO StationGroupHistory VALUES(?, datetime(?), ?)",
          ).run(res.stationGroupCode, elem.date, userId);
        });
      } else {
        unknown_history.station_group_history.push({
          history: data.history,
          info: data.info,
          query: data.history.map(
            (hist) => `postStationGroupDate?date=${hist.date}&code=`,
          ),
        });
      }
    });
  })();

  // stationgroups最終アクセスの更新
  db.prepare(
    `
    INSERT INTO LatestStationGroupHistory(stationGroupCode, date, userId)
    SELECT stationGroupCode, MAX(date), userId
    FROM StationGroupHistory
    WHERE userId = ?
    GROUP BY stationGroupCode
    HAVING MAX(date) IS NOT NULL
  `,
  ).run(userId);

  unknown_history.station_history = unknown_history.station_history.sort(
    (a, b) =>
      new Date(a.history[0].date) < new Date(b.history[0].date) ? -1 : 1,
  );
  unknown_history.station_group_history =
    unknown_history.station_group_history.sort((a, b) =>
      new Date(a.history[0].date) < new Date(b.history[0].date) ? -1 : 1,
    );
  return unknown_history;
};

// 履歴のjsonの形式をチェックする
export const check_json_format = (json: unknown): json is ExportHistoryJSON => {
  if (typeof json !== "object" || json === null) return false;
  const obj = json as Record<string, unknown>;
  if (!("station_history" in obj)) return false;
  if (!("station_group_history" in obj)) return false;
  if (!Array.isArray(obj.station_history)) return false;
  if (!Array.isArray(obj.station_group_history)) return false;

  // station history
  for (let i = 0; i < obj.station_history.length; i++) {
    const history = obj.station_history[i] as Record<string, unknown>;
    if (!("history" in history)) return false;
    if (!("info" in history)) return false;
    if (!Array.isArray(history.history)) return false;
    for (let j = 0; j < history.history.length; j++) {
      if (!("date" in (history.history[j] as Record<string, unknown>)))
        return false;
      if (!("state" in (history.history[j] as Record<string, unknown>)))
        return false;
    }
    const info = history.info as Record<string, unknown>;
    if (!("railwayCode" in info)) return false;
    if (!("latitude" in info)) return false;
    if (!("longitude" in info)) return false;
    if (!("railwayName" in info)) return false;
    if (!("companyName" in info)) return false;
  }

  // station group history
  for (let i = 0; i < obj.station_group_history.length; i++) {
    const history = obj.station_group_history[i] as Record<string, unknown>;
    if (!("history" in history)) return false;
    if (!("info" in history)) return false;
    if (!Array.isArray(history.history)) return false;
    for (let j = 0; j < history.history.length; j++) {
      if (!("date" in (history.history[j] as Record<string, unknown>)))
        return false;
    }
    const info = history.info as Record<string, unknown>;
    if (!("stationName" in info)) return false;
    if (!("latitude" in info)) return false;
    if (!("longitude" in info)) return false;
  }
  return true;
};

export const import_stationURL = (
  db: Database.Database,
  input_json: { data: { stationCode: number; timetable: { direction: string; url: string }[]; trainPosURL: string | null }[] },
): void => {
  db.transaction(() => {
    db.prepare("DELETE FROM TimetableLinks").run();
    input_json.data.forEach((data) => {
      if (!data.stationCode) return;
      data.timetable.forEach((timedata) => {
        if (!timedata.direction || !timedata.url) return;

        const station = db
          .prepare(`SELECT * FROM Stations WHERE stationCode = ?`)
          .get(data.stationCode);
        if (station === undefined) {
          console.log(`駅コード ${data.stationCode} が見つかりませんでした。`);
          return;
        }

        db.prepare(
          `
          INSERT INTO TimetableLinks VALUES(?, ?, ?)
        `,
        ).run(data.stationCode, timedata.direction, timedata.url);
      });
      db.prepare(
        `
        UPDATE TrainPosLinks SET url = ?
        WHERE stationCode = ?
      `,
      ).run(data.trainPosURL ?? null, data.stationCode);
    });
  })();
};
