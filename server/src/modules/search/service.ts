import * as searchRepo from "./repository";

export const searchStationGroupList = (name: string, off: number, len: number) => {
  return searchRepo.searchStationGroups(name, off, len);
};

export const searchStationGroupCount = (name: string): number => {
  return searchRepo.countStationGroups(name);
};

export const searchNearestStationGroups = (lat: number, lng: number, num: number) => {
  return searchRepo.findNearestStationGroups(lat, lng, num);
};
