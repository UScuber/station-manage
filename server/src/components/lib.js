const { db } = require("./db");


const is_valid_date_str = (date) => /^\d{4}-\d{1,2}-\d{1,2} \d{2}:\d{2}:\d{2}$/.test(date);

const convert_date = (date) => {
  if(!(date instanceof Date) && !is_valid_date_str(date)) return undefined;
  const date_options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return new Date(date).toLocaleString("ja-JP", date_options).replaceAll("/", "-");
};


const insert_next_stations = (elem, code) => {
  let next_stations = {};
  next_stations["left"] = db.prepare(`
    SELECT nextStationCode FROM NextStations
    WHERE stationCode = ? AND direction = 0
  `).all(code);
  next_stations["right"] = db.prepare(`
    SELECT nextStationCode FROM NextStations
    WHERE stationCode = ? AND direction = 1
  `).all(code);
  Object.keys(next_stations).forEach(key => {
    elem[key] = next_stations[key].map(e => e.nextStationCode);
  });
  return elem;
};

const set_cache_control = (res) => {
  res.setHeader("Cache-Control", [
    "max-age=" + 60*60*24*7, // 1 week
    "stale-while-revalidate=" + 60*60*24*7, // 1 week
    "stale-if-error=" + 60*60*24*7, // 1 week
  ]);
};

/**
 * 駅リストに visitType を付加する
 * @param {Array} stationList - stationCode, stationGroupCode を含む駅データの配列
 * @param {string|null} userId - ユーザーID（未ログインなら null）
 * @returns {Array} visitType が付加された駅データの配列
 */
const attachVisitType = (stationList, userId) => {
  if(!userId || stationList.length === 0){
    return stationList.map(s => ({ ...s, visitType: 0 }));
  }

  const stationCodes = stationList.map(s => s.stationCode);
  const placeholders = stationCodes.map(() => '?').join(',');

  // 各駅の乗降り(state=0)/通過(state=1)の有無を取得
  const latestHistories = db.prepare(`
    SELECT stationCode, state FROM LatestStationHistory
    WHERE userId = ? AND stationCode IN (${placeholders})
  `).all(userId, ...stationCodes);

  // stationCode -> { hasGet, hasPass }
  const historyMap = {};
  for(const h of latestHistories){
    if(!historyMap[h.stationCode]) historyMap[h.stationCode] = { hasGet: false, hasPass: false };
    if(h.state === 0) historyMap[h.stationCode].hasGet = true;
    if(h.state === 1) historyMap[h.stationCode].hasPass = true;
  }

  // 乗降りがある駅のstationCodeリスト
  const getStationCodes = stationCodes.filter(c => historyMap[c]?.hasGet);

  // 改札下車判定
  let gateExitStations = new Set();
  if(getStationCodes.length > 0){
    const codeToGroup = {};
    for(const s of stationList){
      codeToGroup[s.stationCode] = s.stationGroupCode;
    }

    const getGroupCodes = [...new Set(getStationCodes.map(c => codeToGroup[c]))];

    const groupHistories = db.prepare(`
      SELECT stationGroupCode, date FROM StationGroupHistory
      WHERE userId = ? AND stationGroupCode IN (${getGroupCodes.map(() => '?').join(',')})
    `).all(userId, ...getGroupCodes);

    const groupDateMap = {};
    for(const gh of groupHistories){
      if(!groupDateMap[gh.stationGroupCode]) groupDateMap[gh.stationGroupCode] = [];
      groupDateMap[gh.stationGroupCode].push(new Date(gh.date).getTime());
    }

    if(Object.keys(groupDateMap).length > 0){
      const getPlaceholders = getStationCodes.map(() => '?').join(',');
      const stationHistories = db.prepare(`
        SELECT stationCode, date FROM StationHistory
        WHERE userId = ? AND state = 0 AND stationCode IN (${getPlaceholders})
      `).all(userId, ...getStationCodes);

      const twentyFourHours = 24 * 60 * 60 * 1000;
      for(const sh of stationHistories){
        const groupCode = codeToGroup[sh.stationCode];
        const groupDates = groupDateMap[groupCode];
        if(!groupDates) continue;

        const getTime = new Date(sh.date).getTime();
        for(const gd of groupDates){
          if(getTime - twentyFourHours <= gd && gd <= getTime + twentyFourHours){
            gateExitStations.add(sh.stationCode);
            break;
          }
        }
      }
    }
  }

  return stationList.map(s => {
    const h = historyMap[s.stationCode];
    let visitType = 0;
    if(h){
      if(h.hasGet){
        visitType = gateExitStations.has(s.stationCode) ? 3 : 2;
      }else if(h.hasPass){
        visitType = 1;
      }
    }
    return { ...s, visitType };
  });
};

exports.convert_date = convert_date;
exports.insert_next_stations = insert_next_stations;
exports.set_cache_control = set_cache_control;
exports.attachVisitType = attachVisitType;
