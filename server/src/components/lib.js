const { db } = require("../db/connection");
const { RecordState, VisitType } = require("../constants");

const is_valid_date_str = (date) =>
  /^\d{4}-\d{1,2}-\d{1,2} \d{2}:\d{2}:\d{2}$/.test(date);

const convert_date = (date) => {
  if (!(date instanceof Date) && !is_valid_date_str(date)) return undefined;
  const date_options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return new Date(date)
    .toLocaleString("ja-JP", date_options)
    .replaceAll("/", "-");
};

const insert_next_stations = (elem, code) => {
  const left = db
    .prepare(
      `
    SELECT nextStationCode FROM NextStations
    WHERE stationCode = ? AND direction = 0
  `,
    )
    .all(code)
    .map((e) => e.nextStationCode);
  const right = db
    .prepare(
      `
    SELECT nextStationCode FROM NextStations
    WHERE stationCode = ? AND direction = 1
  `,
    )
    .all(code)
    .map((e) => e.nextStationCode);
  return { ...elem, left, right };
};

const CACHE_CONTROL_VALUE =
  "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800";

const buildHistoryMap = (userId, stationCodes) => {
  const placeholders = stationCodes.map(() => "?").join(",");
  const latestHistories = db
    .prepare(
      `
    SELECT stationCode, state FROM LatestStationHistory
    WHERE userId = ? AND stationCode IN (${placeholders})
  `,
    )
    .all(userId, ...stationCodes);

  const historyMap = {};
  for (const h of latestHistories) {
    if (!historyMap[h.stationCode])
      historyMap[h.stationCode] = { hasGet: false, hasPass: false };
    if (h.state === RecordState.Get) historyMap[h.stationCode].hasGet = true;
    if (h.state === RecordState.Pass) historyMap[h.stationCode].hasPass = true;
  }
  return historyMap;
};

const findGateExitStations = (userId, stationList, getStationCodes) => {
  if (getStationCodes.length === 0) return new Set();

  const codeToGroup = {};
  for (const s of stationList) {
    codeToGroup[s.stationCode] = s.stationGroupCode;
  }

  const getGroupCodes = [
    ...new Set(getStationCodes.map((c) => codeToGroup[c])),
  ];
  const groupHistories = db
    .prepare(
      `
    SELECT stationGroupCode, date FROM StationGroupHistory
    WHERE userId = ? AND stationGroupCode IN (${getGroupCodes.map(() => "?").join(",")})
  `,
    )
    .all(userId, ...getGroupCodes);

  const groupDateMap = {};
  for (const gh of groupHistories) {
    if (!groupDateMap[gh.stationGroupCode])
      groupDateMap[gh.stationGroupCode] = [];
    groupDateMap[gh.stationGroupCode].push(new Date(gh.date).getTime());
  }

  const gateExitStations = new Set();
  if (Object.keys(groupDateMap).length === 0) return gateExitStations;

  const getPlaceholders = getStationCodes.map(() => "?").join(",");
  const stationHistories = db
    .prepare(
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

const attachVisitType = (stationList, userId) => {
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
    let visitType = VisitType.None;
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

const escapeLikePattern = (str) => str.replace(/[%_]/g, "\\$&");

exports.convert_date = convert_date;
exports.insert_next_stations = insert_next_stations;
exports.CACHE_CONTROL_VALUE = CACHE_CONTROL_VALUE;
exports.attachVisitType = attachVisitType;
exports.escapeLikePattern = escapeLikePattern;
