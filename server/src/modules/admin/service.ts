import { db } from "../../db/connection";
import { export_stationURL } from "../../components/export-sql";
import { import_stationURL } from "../../components/import-sql";
import * as adminRepo from "./repository";

export const getTimetableURL = (stationCode: number) => {
  const timetable = adminRepo.findTimetableURLs(stationCode);
  const trainPos = adminRepo.findTrainPosURL(stationCode);
  return {
    timetable,
    trainPos: trainPos?.url ?? "",
  };
};

export const updateTimetableURL = (
  code: number,
  direction: string,
  mode: "update" | "delete",
  url?: string,
): boolean => {
  if (mode === "update" && !url) {
    return false;
  }
  if (mode === "update") {
    adminRepo.upsertTimetableURL(code, direction, url!);
  } else {
    adminRepo.deleteTimetableURL(code, direction);
  }
  return true;
};

export const updateTrainPosURL = (code: number, url: string) => {
  adminRepo.updateTrainPosURL(code, url);
};

export const exportStationURL = () => {
  return export_stationURL(db);
};

export const importStationURL = (data: Parameters<typeof import_stationURL>[1]) => {
  import_stationURL(db, data);
};
