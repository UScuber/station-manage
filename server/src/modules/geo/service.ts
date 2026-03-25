import * as geoRepo from "./repository";

export const getRailPath = (railwayCode: number) => {
  const railwayInfo = geoRepo.findRailwayWithCompany(railwayCode);
  return geoRepo.buildRailwayPathGeoJSON(railwayCode, railwayInfo);
};

export const getRailPathList = (companyCode: number) => {
  const railwayList = geoRepo.findRailwayListByCompanyCode(companyCode);
  return railwayList.map(elem =>
    geoRepo.buildRailwayPathGeoJSON(elem.railwayCode, elem));
};

export const getAllRailPaths = () => {
  const railwayList = geoRepo.findAllRailwayList();
  return railwayList.map(elem =>
    geoRepo.buildRailwayPathGeoJSON(elem.railwayCode, elem));
};
