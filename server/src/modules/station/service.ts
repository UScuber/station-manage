import { insert_next_stations } from "../../shared/station";
import { attachVisitType } from "../../shared/visit-type";
import * as stationRepo from "./repository";

export const getStation = (stationCode: number) => {
  const data = stationRepo.findStationByCode(stationCode);
  if (!data) return null;
  return insert_next_stations(data, stationCode);
};

export const getStationGroup = (stationGroupCode: number) => {
  return stationRepo.findStationGroupByCode(stationGroupCode);
};

export const getStationsByGroupCode = (stationGroupCode: number, userId: string | null) => {
  const data = stationRepo.findStationsByGroupCode(stationGroupCode);
  if (!data.length) return null;
  const result = data.map(station => insert_next_stations(station, station.stationCode));
  return attachVisitType(result, userId);
};
