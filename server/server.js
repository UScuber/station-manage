const fs = require("fs");
const express = require("express");
const cors = require("cors");
const sqlite3 = require("better-sqlite3");
require("dotenv").config();

const db_path = __dirname + "/station.db";
if(!fs.existsSync(db_path)){
  console.error(`Error: ${db_path} does not exist`);
  process.exit(1);
}

const PORT = process.env.PORT || 3001;
const app = express();

const reg = (() => {
  const split_url = process.env.REACT_URL.split(".");
  const regExpEscape = (str) => str.replace(/[-\\^$*+?.()|\[\]{}]/g, "\\$&");
  return new RegExp(regExpEscape(split_url[0])+(split_url.length > 1 ? "(?:\\-[0-9a-z]{12})?\\." : "") + regExpEscape(split_url.slice(1).join(".")));
})();

app.use(cors({
  origin: (origin, callback) => {
    if(reg.test(origin)){
      callback(null, true);
    }else{
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

const db = sqlite3(db_path);
db.pragma("journal_mode = WAL");


const convert_date = (date) => {
  const date_options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return date ? new Date(date).toLocaleString("ja-JP", date_options).replaceAll("/", "-") : undefined;
};


// manage access log
const log_file = __dirname + "/info.log";
const write_log_data = (log_data) => fs.appendFileSync(log_file, log_data);

const accessLog = (req, res, next) => {
  const log_data = `[${convert_date(new Date())}] ${req.method} ${req.originalUrl}\n`;
  write_log_data(log_data);
  next();
};

app.get("/", accessLog, (req, res) => {
  res.end("OK");
});

app.get("/api", accessLog, (req, res) => {
  res.json({ res: "OK" });
});


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


// 駅情報取得
app.get("/api/station/:stationCode", accessLog, (req, res, next) => {
  const code = req.params.stationCode;
  let data;
  try{
    data = db.prepare(`
      SELECT
        Stations.*,
        StationGroups.stationName,
        StationGroups.kana,
        Prefectures.code AS prefCode,
        Prefectures.name AS prefName,
        Railways.railwayName,
        Railways.railwayColor,
        Companies.companyName AS railwayCompany
      FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND Stations.stationCode = ?
      INNER JOIN Prefectures
        ON StationGroups.prefCode = Prefectures.code
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
    `).get(code);

    data = insert_next_stations(data, code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  if(!data){
    next(new RangeError("Invalid Input"));
  }else{
    res.json(data);
  }
});

// 駅グループの情報取得
app.get("/api/stationGroup/:stationGroupCode", accessLog, (req, res, next) => {
  const code = req.params.stationGroupCode;
  let data;
  try{
    data = db.prepare(`
      SELECT
        StationGroups.*,
        MAX(getDate) AS maxGetDate,
        MAX(passDate) AS maxPassDate,
        Prefectures.name AS prefName
      FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND Stations.stationGroupCode = ?
      INNER JOIN Prefectures
        ON StationGroups.prefCode = Prefectures.code
      GROUP BY Stations.stationGroupCode
    `).get(code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  if(!data){
    next(new RangeError("Invalid input"));
  }else{
    res.json(data);
  }
});

// 駅グループに属する駅の駅情報を取得
app.get("/api/stationsByGroupCode/:stationGroupCode", accessLog, (req, res, next) => {
  const code = req.params.stationGroupCode;
  let data;
  try{
    data = db.prepare(`
      SELECT
        Stations.*,
        StationGroups.stationName,
        StationGroups.kana,
        StationGroups.date,
        Railways.railwayName,
        Companies.companyName AS railwayCompany
      FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND Stations.stationGroupCode = ?
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
    `).all(code);

    data = data.map(station => insert_next_stations(station, station.stationCode));
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  if(!data.length){
    next(new RangeError("Invalid input"));
  }else{
    res.json(data);
  }
});

// 路線情報取得
app.get("/api/railway/:railwayCode", accessLog, (req, res, next) => {
  const code = req.params.railwayCode;
  let data;
  try{
    data = db.prepare(`
      SELECT
        Railways.*,
        Companies.companyName,
        Companies.formalName AS companyFormalName
      FROM Railways
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
          AND Railways.railwayCode = ?
    `).get(code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  if(!data){
    next(new RangeError("Invalid Input"));
  }else{
    res.json(data);
  }
});

// 路線に属する駅の駅情報を取得
app.get("/api/railwayStations/:railwayCode", accessLog, (req, res, next) => {
  const code = req.params.railwayCode;
  let data;
  try{
    data = db.prepare(`
      SELECT
        Stations.*,
        StationGroups.stationName,
        StationGroups.kana
      FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND Stations.railwayCode = ?
    `).all(code);

    data = data.map(station => insert_next_stations(station, station.stationCode));
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  if(!data.length){
    next(new RangeError("Invalid Input"));
  }else{
    res.json(data);
  }
});

// 会社情報取得
app.get("/api/company/:companyCode", accessLog, (req, res, next) => {
  const code = req.params.companyCode;
  let data;
  try{
    data = db.prepare(`
      SELECT * FROM Companies
      WHERE companyCode = ?
    `).get(code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  if(!data){
    next(new RangeError("Invalid Input"));
  }else{
    res.json(data);
  }
});

// 会社に属する路線の路線情報を取得
app.get("/api/companyRailways/:companyCode", accessLog, (req, res, next) => {
  const code = req.params.companyCode;
  let data;
  try{
    data = db.prepare(`
      SELECT * FROM Railways
      WHERE companyCode = ?
    `).all(code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  if(!data){
    next(new RangeError("Invalid Input"));
  }else{
    res.json(data);
  }
});

// 会社に属する路線の駅情報を全取得
app.get("/api/companyStations/:companyCode", accessLog, (req, res, next) => {
  const code = req.params.companyCode;
  let data;
  try{
    data = db.prepare(`
      SELECT
        Stations.*,
        StationGroups.stationName,
        StationGroups.kana,
        Prefectures.code AS prefCode,
        Prefectures.name AS prefName,
        Railways.railwayName,
        Railways.railwayColor,
        Companies.companyName AS railwayCompany
      FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
          AND Railways.companyCode = ?
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
      INNER JOIN Prefectures
        ON StationGroups.prefCode = Prefectures.code
    `).all(code);

    data = data.map(station => insert_next_stations(station, station.stationCode));
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  if(!data){
    next(new RangeError("Invalid Input"));
  }else{
    res.json(data);
  }
});

// 県に属する路線の路線情報を取得
app.get("/api/prefRailways/:prefCode", accessLog, (req, res, next) => {
  const code = req.params.prefCode;
  let data;
  try{
    data = db.prepare(`
      SELECT
        Railways.railwayCode,
        Railways.railwayName,
        Railways.formalName,
        Railways.railwayKana,
        Railways.railwayColor,
        Railways.companyCode,
        Companies.companyName
      FROM Railways
      INNER JOIN Stations
        ON Railways.railwayCode = Stations.railwayCode
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND StationGroups.prefCode = ?
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
      GROUP BY Railways.railwayCode
    `).all(code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  if(!data){
    next(new RangeError("Invalid Input"));
  }else{
    res.json(data);
  }
});

// 県に属する路線の駅情報を全取得
app.get("/api/prefStations/:prefCode", accessLog, (req, res, next) => {
  const code = req.params.prefCode;
  let data;
  try{
    data = db.prepare(`
      SELECT
        Stations.*,
        StationGroups.stationName,
        StationGroups.kana,
        Railways.railwayName,
        Railways.formalName,
        Railways.railwayKana,
        Railways.railwayColor,
        Railways.companyCode,
        Companies.companyName AS railwayCompany,
        Prefectures.code AS prefCode,
        Prefectures.name AS prefName
      FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
      INNER JOIN (
        SELECT Railways.railwayCode FROM Railways
        INNER JOIN Stations
          ON Railways.railwayCode = Stations.railwayCode
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
            AND StationGroups.prefCode = ?
        GROUP BY Railways.railwayCode
      ) AS Codes
        ON Stations.railwayCode = Codes.railwayCode
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
      INNER JOIN Prefectures
        ON StationGroups.prefCode = Prefectures.code
    `).all(code);

    data = data.map(station => insert_next_stations(station, station.stationCode));
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  if(!data){
    next(new RangeError("Invalid Input"));
  }else{
    res.json(data);
  }
});

// 座標から近い駅/駅グループを複数取得
app.get("/api/searchNearestStationGroup", accessLog, (req, res, next) => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const num = req.query.num ? Math.min(Number(req.query.num), 20) : 20;
  if(lat === undefined || lng == undefined){
    next(new Error("Invalid input"));
    return;
  }
  let data;
  try{
    data = db.prepare(`
      SELECT
        StationGroups.*,
        Prefectures.code AS prefCode,
        Prefectures.name AS prefName,
        (
          6371 * ACOS(
            COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?))
            + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
          )
        ) AS distance
      FROM StationGroups
      INNER JOIN Prefectures
        ON StationGroups.prefCode = Prefectures.code
      ORDER BY distance
      LIMIT ?
    `).all(
      lat,lng,lat, num
    );
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data);
});

// 駅グループを名前で検索、区間指定
app.get("/api/searchStationGroupList", accessLog, (req, res, next) => {
  const off = req.query.off;
  const len = req.query.len;
  const name = req.query.name ?? "";
  if(off === undefined || len === undefined){
    next(new Error("Invalid input"));
    return;
  }
  let data;
  try{
    data = db.prepare(`
      WITH StationData AS (
        SELECT
          StationGroups.*,
          Prefectures.code AS prefCode,
          Prefectures.name AS prefName
        FROM StationGroups
        INNER JOIN Prefectures
          ON StationGroups.prefCode = Prefectures.code
      )
      SELECT * FROM (
          SELECT 0 AS ord, StationData.* FROM StationData
            WHERE stationName = ?
        UNION ALL
          SELECT 1 AS ord, StationData.* FROM StationData
            WHERE stationName LIKE ?
        UNION ALL
          SELECT 2 AS ord, StationData.* FROM StationData
            WHERE stationName LIKE ?
        UNION ALL
          SELECT 3 AS ord, StationData.* FROM StationData
            WHERE stationName LIKE ?
        UNION ALL
          SELECT 4 AS ord, StationData.* FROM StationData
            WHERE kana = ?
        UNION ALL
          SELECT 5 AS ord, StationData.* FROM StationData
            WHERE kana LIKE ?
        UNION ALL
          SELECT 6 AS ord, StationData.* FROM StationData
            WHERE kana LIKE ?
        UNION ALL
          SELECT 7 AS ord, StationData.* FROM StationData
            WHERE kana LIKE ?
      ) AS Results
      GROUP BY Results.stationGroupCode
      ORDER BY Results.ord
      LIMIT ? OFFSET ?
    `).all(
      name,`${name}_%`,`_%${name}`,`_%${name}_%`,
      name,`${name}_%`,`_%${name}`,`_%${name}_%`,
      len, off
    );
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data);
});

// 駅グループを名前で検索した際の件数
app.get("/api/searchStationGroupCount", accessLog, (req, res, next) => {
  const name = req.query.name ?? "";
  let data;
  try{
    data = db.prepare(`
    SELECT COUNT(*) AS count FROM StationGroups
      WHERE stationName = ?
        OR stationName LIKE ?
        OR stationName LIKE ?
        OR stationName LIKE ?
        OR kana = ?
        OR kana LIKE ?
        OR kana LIKE ?
        OR kana LIKE ?
    `).get(
      name,`${name}_%`,`_%${name}`,`_%${name}_%`,
      name,`${name}_%`,`_%${name}`,`_%${name}_%`
    );
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data.count);
});


// 都道府県名を取得
app.get("/api/pref/:prefCode", accessLog, (req, res, next) => {
  const code = req.params.prefCode;
  try{
    data = db.prepare(`
      SELECT * FROM Prefectures
      WHERE code = ?
    `).get(code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data.name);
});

///// History

// 乗降/通過の履歴を区間取得
app.get("/api/stationHistory", accessLog, (req, res, next) => {
  const off = req.query.off;
  const len = req.query.len;
  if(off === undefined || len === undefined){
    next(new Error("Invalid input"));
    return;
  }
  let data;
  try{
    data = db.prepare(
      "SELECT * FROM StationHistory ORDER BY date DESC LIMIT ? OFFSET ?"
    ).all(len, off);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data);
});

// 乗降/通過の履歴の個数を取得
app.get("/api/stationHistoryCount", accessLog, (req, res, next) => {
  let data;
  try{
    data = db.prepare(
      "SELECT COUNT(*) AS count FROM StationHistory",
    ).get();
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data.count);
});

// 乗降/通過の履歴と駅情報を取得
app.get("/api/stationHistoryAndInfo", accessLog, (req, res, next) => {
  // const off = req.query.off;
  // const len = req.query.len;
  // if(off === undefined || len === undefined){
  //   next(new Error("Invalid input"));
  //   return;
  // }
  let data;
  try{
    data = db.prepare(`
      SELECT
        StationHistory.*,
        Stations.*,
        StationGroups.stationName,
        StationGroups.kana
      FROM StationHistory
      INNER JOIN Stations
        ON StationHistory.stationCode = Stations.stationCode
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
      ORDER BY date DESC
    `).all();

    data = data.map(station => insert_next_stations(station, station.stationCode));
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data);
});

// 駅の履歴を取得
app.get("/api/stationHistory/:stationCode", accessLog, (req, res, next) => {
  const code = req.params.stationCode;
  let data;
  try{
    data = db.prepare(`
      SELECT * FROM StationHistory
      WHERE stationCode = ?
      ORDER BY date DESC
    `).all(code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data);
});

// 駅グループ全体の履歴を取得(各駅の行動も含める)
app.get("/api/stationGroupHistory/:stationGroupCode", accessLog, (req, res, next) => {
  const code = req.params.stationGroupCode;
  let data;
  try{
    data = db.prepare(`
        SELECT
          StationGroupHistory.*,
          2 AS state,
          '' AS railwayName,
          '' AS railwayColor,
          NULL AS stationCode
        FROM StationGroupHistory
        WHERE stationGroupCode = ?
      UNION ALL
        SELECT
          Stations.stationGroupCode,
          StationHistory.date,
          StationHistory.state,
          Railways.railwayName,
          Railways.railwayColor,
          StationHistory.stationCode
        FROM StationHistory
        INNER JOIN Stations
          ON StationHistory.stationCode = Stations.stationCode
            AND Stations.stationGroupCode = ?
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
      ORDER BY date DESC
    `).all(code, code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data);
});

// 乗降/通過の情報を追加
app.get("/api/postStationDate", accessLog, (req, res, next) => {
  const code = req.query.code;
  const date = convert_date(req.query.date);
  const state = req.query.state;
  const value_name = ["getDate", "passDate"][state];
  if(code === undefined || date === undefined || state === undefined){
    next(new Error("Invalid input"));
    return;
  }
  if(state < 0 || state >= 2){
    next(new RangeError("Invalid input"));
    return;
  }
  try{
    db.prepare(
      "INSERT INTO StationHistory VALUES(?, datetime(?), ?)"
    ).run(code, date, state);

    db.prepare(
      `UPDATE Stations SET ${value_name} = MAX(IFNULL(${value_name}, 0), datetime(?)) WHERE stationCode = ?`
    ).run(date, code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.end("OK");
});

// 立ち寄りの情報を追加
app.get("/api/postStationGroupDate", accessLog, (req, res, next) => {
  const code = req.query.code;
  const date = convert_date(req.query.date);
  if(code === undefined || date === undefined){
    next(new Error("Invalid input"));
    return;
  }
  try{
    db.prepare("INSERT INTO StationGroupHistory VALUES(?, datetime(?))")
      .run(code, date);

    db.prepare(
      `UPDATE StationGroups SET date = MAX(IFNULL(date, 0), datetime(?)) WHERE stationGroupCode = ?`
    ).run(date, code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.end("OK");
});

// 乗降/通過の履歴を削除
app.get("/api/deleteStationDate", accessLog, (req, res, next) => {
  const code = req.query.code;
  const date = convert_date(req.query.date);
  const state = req.query.state;
  const value_name = ["getDate", "passDate"][state];
  if(code === undefined || date === undefined || state === undefined){
    next(new Error("Invalid input"));
    return;
  }
  if(state < 0 || state >= 2){
    next(new RangeError("Invalid input"));
    return;
  }
  try{
    db.prepare(`
      DELETE FROM StationHistory
      WHERE stationCode = ? AND date = datetime(?) AND state = ?
    `).run(code, date, state);

    db.prepare(`
      UPDATE Stations SET ${value_name} = (
        SELECT MAX(date) FROM StationHistory
        WHERE stationCode = ? AND state = ?
      )
      WHERE stationCode = ? AND ${value_name} = datetime(?)
    `).run(code, state, code, date);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.end("OK");
});

// 立ち寄りの履歴を削除
app.get("/api/deleteStationGroupState", accessLog, (req, res, next) => {
  const code = req.query.code;
  const date = convert_date(req.query.date);
  if(code === undefined || date === undefined){
    next(new Error("Invalid input"));
    return;
  }
  try{
    db.prepare(`
      DELETE FROM StationGroupHistory
      WHERE stationGroupCode = ? AND date = datetime(?)
    `).run(code, date);

    db.prepare(`
      UPDATE StationGroups SET date = (
        SELECT MAX(date) FROM StationGroupHistory
        WHERE stationGroupCode = ?
      )
      WHERE stationGroupCode = ?
    `).run(code, code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.end("OK");
});


app.use((err, req, res, next) => {
  console.error(`\x1b[31m[${err.name}] ${err.message}\x1b[39m`, err.stack.substr(err.stack.indexOf("\n")));
  const log_data = `[${err.name}] ${err.message} (${req.method} ${req.originalUrl}) ${err.stack.substr(err.stack.indexOf("\n"))}\n`;
  write_log_data(log_data);
  res.status(500).send(err.message);
});

app.listen(PORT);
console.log(`Server running at ${PORT}`);
