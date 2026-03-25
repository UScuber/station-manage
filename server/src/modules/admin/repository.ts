import { db } from "../../db/connection";

export const findTimetableURLs = (stationCode: number) => {
  return db.prepare(`
    SELECT direction, url FROM TimetableLinks
    WHERE stationCode = ?
  `).all(stationCode);
};

export const findTrainPosURL = (stationCode: number) => {
  return db.prepare<unknown[], { url: string }>(`
    SELECT url FROM TrainPosLinks
    WHERE stationCode = ?
  `).get(stationCode);
};

export const upsertTimetableURL = (code: number, direction: string, url: string) => {
  db.prepare(`
    INSERT INTO TimetableLinks VALUES(?, ?, ?)
    ON CONFLICT(stationCode, direction)
    DO UPDATE SET url = ?
  `).run(code, direction, url, url);
};

export const deleteTimetableURL = (code: number, direction: string) => {
  db.prepare(`
    DELETE FROM TimetableLinks
    WHERE stationCode = ? AND direction = ?
  `).run(code, direction);
};

export const updateTrainPosURL = (code: number, url: string) => {
  db.prepare(`
    UPDATE TrainPosLinks SET url = ?
    WHERE stationCode = ?
  `).run(url, code);
};
