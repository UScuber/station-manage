import { db } from "../../db/connection";
import { exportStationURL as exportStationURLData } from "../history/export";
import { importStationURL as importStationURLData } from "../history/import";
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
  return exportStationURLData(db);
};

export const importStationURL = (data: Parameters<typeof importStationURLData>[1]) => {
  importStationURLData(db, data);
};
