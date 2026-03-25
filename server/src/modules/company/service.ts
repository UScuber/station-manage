import { insert_next_stations } from "../../shared/station";
import { attachVisitType } from "../../shared/visit-type";
import * as companyRepo from "./repository";

export const getCompany = (companyCode: number) => {
  return companyRepo.findCompanyByCode(companyCode);
};

export const getAllCompanies = () => {
  return companyRepo.findAllCompanies();
};

export const getCompanyRailways = (companyCode: number) => {
  return companyRepo.findRailwaysByCompanyCode(companyCode);
};

export const getCompanyStations = (companyCode: number, userId: string | null) => {
  const data = companyRepo.findStationsByCompanyCode(companyCode);
  const result = data.map(station => insert_next_stations(station, station.stationCode));
  return attachVisitType(result, userId);
};
