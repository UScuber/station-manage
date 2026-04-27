import { insertNextStations } from "../../shared/station";
import { attachVisitType } from "../../shared/visit-type";
import * as stationRepo from "./repository";

export const getStation = (stationCode: number) => {
  const data = stationRepo.findStationByCode(stationCode);
  return insertNextStations(data, stationCode);
};

export const getStationGroup = (stationGroupCode: number) => {
  return stationRepo.findStationGroupByCode(stationGroupCode);
};

export const getStationsByGroupCode = (stationGroupCode: number, userId: string | null) => {
  const data = stationRepo.findStationsByGroupCode(stationGroupCode);
  if (!data.length) return null;
  const result = data.map(station => insertNextStations(station, station.stationCode));
  return attachVisitType(result, userId);
};
