import { insert_next_stations } from "../../shared/station";
import { attachVisitType } from "../../shared/visit-type";
import * as prefRepo from "./repository";

export const getPrefecture = (prefCode: number) => {
  return prefRepo.findPrefectureByCode(prefCode);
};

export const getAllPrefectures = () => {
  return prefRepo.findAllPrefectures();
};

export const getPrefRailways = (prefCode: number) => {
  return prefRepo.findRailwaysByPrefCode(prefCode);
};

export const getPrefStations = (prefCode: number, userId: string | null) => {
  const data = prefRepo.findStationsByPrefCode(prefCode);
  const result = data.map(station => insert_next_stations(station, station.stationCode));
  return attachVisitType(result, userId);
};
