import { db } from "../../db/connection";
import { convert_date } from "../../shared/date";
import { insert_next_stations } from "../../shared/station";
import { attachVisitType } from "../../shared/visit-type";
import { export_sql } from "../../components/export-sql";
import { import_sql } from "../../components/import-sql";
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
  return data.map(station => insert_next_stations(station, station.stationCode));
};

export const getStationHistoryCount = (query: HistoryFilterQuery, userId: string) => {
  return historyRepo.countStationHistory(query, userId);
};

export const getStationHistoryDetail = (userId: string) => {
  const data = historyRepo.findStationHistoryDetail(userId);
  const result = data.map(station => insert_next_stations(station, station.stationCode));
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
  historyRepo.insertStationDate(code, convert_date(date), state, userId);
};

export const postStationGroupDate = (code: number, date: string, userId: string) => {
  historyRepo.insertStationGroupDate(code, convert_date(date), userId);
};

export const deleteStationDate = (code: number, date: string, state: number, userId: string) => {
  historyRepo.removeStationDate(code, convert_date(date), state, userId);
};

export const deleteStationGroupDate = (code: number, date: string, userId: string) => {
  historyRepo.removeStationGroupDate(code, convert_date(date), userId);
};

export const exportHistory = (userId: string) => {
  return export_sql(db, userId);
};

export const importHistory = (data: ExportHistoryJSON, userId: string) => {
  import_sql(db, data, userId);
};
