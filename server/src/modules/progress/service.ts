import * as progressRepo from "./repository";

interface ProgressResult {
  stationNum: number;
  getOrPassStationNum: number;
}

const zipProgress = (
  stationList: { num: number }[],
  visitedList: { num: number }[],
): ProgressResult[] => {
  return stationList.map((elem, idx) => ({
    stationNum: elem.num,
    getOrPassStationNum: visitedList[idx].num,
  }));
};

// --- Railway ---

export const getRailwayProgress = (railwayCode: number, userId: string): ProgressResult => {
  const stationNum = progressRepo.countStationsByRailway(railwayCode);
  const getOrPassStationNum = progressRepo.countVisitedStationsByRailway(railwayCode, userId);
  return { stationNum, getOrPassStationNum };
};

export const getRailwayProgressList = (companyCode: number, userId: string): ProgressResult[] => {
  const stationList = progressRepo.countStationsGroupedByRailway(companyCode);
  const visitedList = progressRepo.countVisitedStationsGroupedByRailway(companyCode, userId);
  return zipProgress(stationList, visitedList);
};

export const getRailwayProgressListByPref = (prefCode: number, userId: string): ProgressResult[] => {
  const stationList = progressRepo.countStationsGroupedByRailwayForPref(prefCode);
  const visitedList = progressRepo.countVisitedStationsGroupedByRailwayForPref(prefCode, userId);
  return zipProgress(stationList, visitedList);
};

export const getRailwayProgressListAll = (userId: string): ProgressResult[] => {
  const stationList = progressRepo.countAllStationsGroupedByRailway();
  const visitedList = progressRepo.countAllVisitedStationsGroupedByRailway(userId);
  return zipProgress(stationList, visitedList);
};

// --- Company ---

export const getCompanyProgress = (companyCode: number, userId: string): ProgressResult => {
  const stationNum = progressRepo.countStationsByCompany(companyCode);
  const getOrPassStationNum = progressRepo.countVisitedStationsByCompany(companyCode, userId);
  return { stationNum, getOrPassStationNum };
};

export const getCompanyProgressList = (userId: string): ProgressResult[] => {
  const stationList = progressRepo.countAllStationsGroupedByCompany();
  const visitedList = progressRepo.countAllVisitedStationsGroupedByCompany(userId);
  return zipProgress(stationList, visitedList);
};

// --- Prefecture ---

export const getPrefProgress = (prefCode: number, userId: string): ProgressResult => {
  const stationNum = progressRepo.countStationsByPref(prefCode);
  const getOrPassStationNum = progressRepo.countVisitedStationsByPref(prefCode, userId);
  return { stationNum, getOrPassStationNum };
};

export const getPrefProgressList = (userId: string): ProgressResult[] => {
  const stationList = progressRepo.countAllStationsGroupedByPref();
  const visitedList = progressRepo.countAllVisitedStationsGroupedByPref(userId);
  return zipProgress(stationList, visitedList);
};
