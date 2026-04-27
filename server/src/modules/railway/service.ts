import { insertNextStations } from "../../shared/station";
import { attachVisitType } from "../../shared/visit-type";
import * as railwayRepo from "./repository";

export const getRailway = (railwayCode: number) => {
  return railwayRepo.findRailwayByCode(railwayCode);
};

export const getAllRailways = () => {
  return railwayRepo.findAllRailways();
};

export const getRailwayStations = (railwayCode: number, userId: string | null) => {
  const data = railwayRepo.findStationsByRailwayCode(railwayCode);
  if (!data.length) return null;
  const result = data.map(station => insertNextStations(station, station.stationCode));
  return attachVisitType(result, userId);
};
