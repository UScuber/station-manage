const { db } = require("./db");


const is_valid_date = (date) => /^\d{4}-\d{1,2}-\d{1,2} \d{2}:\d{2}:\d{2}$/.test(date);

const convert_date = (date) => {
  if(!is_valid_date(date)) return undefined;
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

exports.convert_date = convert_date;
exports.insert_next_stations = insert_next_stations;
exports.set_cache_control = set_cache_control;
