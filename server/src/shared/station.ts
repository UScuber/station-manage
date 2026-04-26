import { db } from "../db/connection";

export const batchNextStations = (
  codes: number[],
): Record<number, { left: number[]; right: number[] }> => {
  if (codes.length === 0) return {};
  const placeholders = codes.map(() => "?").join(",");
  const rows = db
    .prepare<number[], { stationCode: number; nextStationCode: number; direction: number }>(
      `
    SELECT stationCode, nextStationCode, direction FROM NextStations
    WHERE stationCode IN (${placeholders})
  `,
    )
    .all(...codes);
  const map: Record<number, { left: number[]; right: number[] }> = {};
  for (const row of rows) {
    if (!map[row.stationCode]) map[row.stationCode] = { left: [], right: [] };
    if (row.direction === 0) map[row.stationCode].left.push(row.nextStationCode);
    else map[row.stationCode].right.push(row.nextStationCode);
  }
  return map;
};

export const insertNextStations = <T>(
  elem: T,
  code: number,
): T & { left: number[]; right: number[] } => {
  const left = db
    .prepare<[number], { nextStationCode: number }>(
      `
    SELECT nextStationCode FROM NextStations
    WHERE stationCode = ? AND direction = 0
  `,
    )
    .all(code);
  const right = db
    .prepare<[number], { nextStationCode: number }>(
      `
    SELECT nextStationCode FROM NextStations
    WHERE stationCode = ? AND direction = 1
  `,
    )
    .all(code);
  return {
    ...elem,
    left: left.map((e) => e.nextStationCode),
    right: right.map((e) => e.nextStationCode),
  };
};
