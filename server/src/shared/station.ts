import { db } from "../db/connection";

export const insert_next_stations = <T extends Record<string, unknown>>(
  elem: T,
  code: number,
): T & { left: number[]; right: number[] } => {
  const left = db
    .prepare<unknown[], { nextStationCode: number }>(
      `
    SELECT nextStationCode FROM NextStations
    WHERE stationCode = ? AND direction = 0
  `,
    )
    .all(code);
  const right = db
    .prepare<unknown[], { nextStationCode: number }>(
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
