import { db } from "../db/connection";
import { RecordState, VisitType } from "../constants";
import type { HistoryMapEntry } from "../types";

const buildHistoryMap = (
  userId: string,
  stationCodes: number[],
): Record<number, HistoryMapEntry> => {
  const placeholders = stationCodes.map(() => "?").join(",");
  const latestHistories = db
    .prepare<unknown[], { stationCode: number; state: number }>(
      `
    SELECT stationCode, state FROM LatestStationHistory
    WHERE userId = ? AND stationCode IN (${placeholders})
  `,
    )
    .all(userId, ...stationCodes);

  const historyMap: Record<number, HistoryMapEntry> = {};
  for (const h of latestHistories) {
    if (!historyMap[h.stationCode])
      historyMap[h.stationCode] = { hasGet: false, hasPass: false };
    if (h.state === RecordState.Get) historyMap[h.stationCode].hasGet = true;
    if (h.state === RecordState.Pass) historyMap[h.stationCode].hasPass = true;
  }
  return historyMap;
};

const findGateExitStations = (
  userId: string,
  stationList: { stationCode: number; stationGroupCode: number }[],
  getStationCodes: number[],
): Set<number> => {
  if (getStationCodes.length === 0) return new Set();

  const codeToGroup: Record<number, number> = {};
  for (const s of stationList) {
    codeToGroup[s.stationCode] = s.stationGroupCode;
  }

  const getGroupCodes = [
    ...new Set(getStationCodes.map((c) => codeToGroup[c])),
  ];
  const groupHistories = db
    .prepare<unknown[], { stationGroupCode: number; date: string }>(
      `
    SELECT stationGroupCode, date FROM StationGroupHistory
    WHERE userId = ? AND stationGroupCode IN (${getGroupCodes.map(() => "?").join(",")})
  `,
    )
    .all(userId, ...getGroupCodes);

  const groupDateMap: Record<number, number[]> = {};
  for (const gh of groupHistories) {
    if (!groupDateMap[gh.stationGroupCode])
      groupDateMap[gh.stationGroupCode] = [];
    groupDateMap[gh.stationGroupCode].push(new Date(gh.date).getTime());
  }

  const gateExitStations = new Set<number>();
  if (Object.keys(groupDateMap).length === 0) return gateExitStations;

  const getPlaceholders = getStationCodes.map(() => "?").join(",");
  const stationHistories = db
    .prepare<unknown[], { stationCode: number; date: string }>(
      `
    SELECT stationCode, date FROM StationHistory
    WHERE userId = ? AND state = ${RecordState.Get} AND stationCode IN (${getPlaceholders})
  `,
    )
    .all(userId, ...getStationCodes);

  const twentyFourHours = 24 * 60 * 60 * 1000;
  for (const sh of stationHistories) {
    const groupCode = codeToGroup[sh.stationCode];
    const groupDates = groupDateMap[groupCode];
    if (!groupDates) continue;

    const getTime = new Date(sh.date).getTime();
    for (const gd of groupDates) {
      if (getTime - twentyFourHours <= gd && gd <= getTime + twentyFourHours) {
        gateExitStations.add(sh.stationCode);
        break;
      }
    }
  }
  return gateExitStations;
};

export const attachVisitType = <
  T extends { stationCode: number; stationGroupCode: number },
>(
  stationList: T[],
  userId: string | null,
): (T & { visitType: number })[] => {
  if (!userId || stationList.length === 0) {
    return stationList.map((s) => ({ ...s, visitType: VisitType.None }));
  }

  const stationCodes = stationList.map((s) => s.stationCode);
  const historyMap = buildHistoryMap(userId, stationCodes);
  const getStationCodes = stationCodes.filter((c) => historyMap[c]?.hasGet);
  const gateExitStations = findGateExitStations(
    userId,
    stationList,
    getStationCodes,
  );

  return stationList.map((s) => {
    const h = historyMap[s.stationCode];
    let visitType: number = VisitType.None;
    if (h) {
      if (h.hasGet) {
        visitType = gateExitStations.has(s.stationCode)
          ? VisitType.GateExit
          : VisitType.Get;
      } else if (h.hasPass) {
        visitType = VisitType.Pass;
      }
    }
    return { ...s, visitType };
  });
};
