import { db } from "../../db/connection";
import { convertDate } from "../../shared/date";
import { insertNextStations, batchNextStations } from "../../shared/station";
import { attachVisitType } from "../../shared/visit-type";
import { exportHistory as exportHistoryData } from "./export";
import { importHistory as importHistoryData } from "./import";
import type { ExportHistoryJSON } from "../../types";
import * as historyRepo from "./repository";
import type { HistoryFilterQuery } from "./schema";

export const getLatestStationHistory = (stationCode: number, userId: string) => {
  return historyRepo.findLatestStationHistory(stationCode, userId);
};

export const getLatestStationHistoryByRailway = (railwayCode: number, userId: string) => {
  return historyRepo.findLatestStationHistoryByRailway(railwayCode, userId);
};

export const getLatestStationGroupHistory = (stationGroupCode: number, userId: string) => {
  return historyRepo.findLatestStationGroupHistory(stationGroupCode, userId);
};

export const getStationHistoryList = (
  query: HistoryFilterQuery,
  userId: string,
  off: number,
  len: number,
) => {
  const data = historyRepo.findStationHistoryList(query, userId, off, len);
  return data.map(station => insertNextStations(station, station.stationCode));
};

export const getStationHistoryCount = (query: HistoryFilterQuery, userId: string) => {
  return historyRepo.countStationHistory(query, userId);
};

export const getStationHistoryDetail = (userId: string) => {
  const data = historyRepo.findStationHistoryDetail(userId);
  const nextMap = batchNextStations(data.map(s => s.stationCode));
  const result = data.map(station => ({
    ...station,
    left: nextMap[station.stationCode]?.left ?? [],
    right: nextMap[station.stationCode]?.right ?? [],
  }));
  return attachVisitType(result, userId);
};

export const getStationHistory = (stationCode: number, userId: string) => {
  return historyRepo.findStationHistoryByCode(stationCode, userId);
};

export const getStationGroupHistory = (stationGroupCode: number, userId: string) => {
  return historyRepo.findStationGroupHistoryByCode(stationGroupCode, userId);
};

export const searchStationGroupHistoryList = (
  name: string,
  userId: string,
  off: number,
  len: number,
) => {
  return historyRepo.searchStationGroupHistoryList(name, userId, off, len);
};

export const postStationDate = (code: number, date: string, state: number, userId: string) => {
  historyRepo.insertStationDate(code, convertDate(date), state, userId);
};

export const postStationGroupDate = (code: number, date: string, userId: string) => {
  historyRepo.insertStationGroupDate(code, convertDate(date), userId);
};

export const deleteStationDate = (code: number, date: string, state: number, userId: string) => {
  historyRepo.removeStationDate(code, convertDate(date), state, userId);
};

export const deleteStationGroupDate = (code: number, date: string, userId: string) => {
  historyRepo.removeStationGroupDate(code, convertDate(date), userId);
};

export const exportHistory = (userId: string) => {
  return exportHistoryData(db, userId);
};

export const importHistory = (data: ExportHistoryJSON, userId: string) => {
  importHistoryData(db, data, userId);
};
