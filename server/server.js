const fs = require("fs");
const express = require("express");
const cors = require("cors");
const sqlite3 = require("better-sqlite3");
const { Users } = require("./user");
const cookie = require("cookie-parser");
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

app.use(cookie());


const db = sqlite3(db_path);
db.pragma("journal_mode = WAL");


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
  res.end("OK");
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
  const code = +req.params.stationCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
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
        Railways.railwayCode,
        Railways.railwayColor,
        Companies.companyCode,
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
  const code = +req.params.stationGroupCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
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
  const code = +req.params.stationGroupCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
  let data;
  try{
    data = db.prepare(`
      SELECT
        Stations.*,
        StationGroups.stationName,
        StationGroups.kana,
        StationGroups.date,
        Railways.railwayName,
        Railways.railwayColor,
        Companies.companyCode,
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
  const code = +req.params.railwayCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
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

// 路線情報全取得
app.get("/api/railway", accessLog, (req, res, next) => {
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
    `).all();
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data);
});

// 路線に属する駅の駅情報を取得
app.get("/api/railwayStations/:railwayCode", accessLog, (req, res, next) => {
  const code = +req.params.railwayCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
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
        Companies.companyCode,
        Companies.companyName AS railwayCompany
      FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND Stations.railwayCode = ?
      INNER JOIN Prefectures
        ON StationGroups.prefCode = Prefectures.code
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
    next(new RangeError("Invalid Input"));
  }else{
    res.json(data);
  }
});

// 会社情報取得
app.get("/api/company/:companyCode", accessLog, (req, res, next) => {
  const code = +req.params.companyCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
  let data;
  try{
    if(code === 0){
      data = {
        companyCode: 0,
        companyName: "JR",
        formalName: "JR",
      };
    }else{
      data = db.prepare(`
        SELECT * FROM Companies
        WHERE companyCode = ?
      `).get(code);
    }
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

// 会社情報全取得
app.get("/api/company", accessLog, (req, res, next) => {
  let data;
  try{
    data = db.prepare(`
      SELECT * FROM Companies
    `).all();
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
  const code = +req.params.companyCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
  let data;
  try{
    if(code === 0){
      data = db.prepare(`
        SELECT * FROM Railways
        WHERE companyCode <= 6
      `).all();
    }else{
      data = db.prepare(`
        SELECT * FROM Railways
        WHERE companyCode = ?
      `).all(code);
    }
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
  const code = +req.params.companyCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
  let data;
  try{
    if(code === 0){
      data = db.prepare(`
        SELECT
          Stations.*,
          StationGroups.stationName,
          StationGroups.kana,
          Prefectures.code AS prefCode,
          Prefectures.name AS prefName,
          Railways.railwayName,
          Railways.railwayColor,
          Companies.companyCode,
          Companies.companyName AS railwayCompany
        FROM Stations
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
            AND Railways.companyCode <= 6
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
        INNER JOIN Prefectures
          ON StationGroups.prefCode = Prefectures.code
      `).all();
    }else{
      data = db.prepare(`
        SELECT
          Stations.*,
          StationGroups.stationName,
          StationGroups.kana,
          Prefectures.code AS prefCode,
          Prefectures.name AS prefName,
          Railways.railwayName,
          Railways.railwayColor,
          Companies.companyCode,
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
    }

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
  const code = +req.params.prefCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
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
  const code = +req.params.prefCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
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
  const lat = +req.query.lat;
  const lng = +req.query.lng;
  const num = req.query.num ? Math.min(parseInt(req.query.num), 20) : 20;
  if(isNaN(lat) || isNaN(lng)){
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
  const off = +req.query.off;
  const len = +req.query.len;
  const name = req.query.name ?? "";
  if(isNaN(off) || isNaN(len)){
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
  const code = +req.params.prefCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
  try{
    data = db.prepare(`
      SELECT
        Prefectures.code AS prefCode,
        Prefectures.name AS prefName
      FROM Prefectures
      WHERE code = ?
    `).get(code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data);
});

// 都道府県名を全取得
app.get("/api/pref", accessLog, (req, res, next) => {
  try{
    data = db.prepare(`
      SELECT
        Prefectures.code AS prefCode,
        Prefectures.name AS prefName
      FROM Prefectures
    `).all();
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data);
});


// 特定の路線のpathデータを取得する(geojson形式)
const get_railway_path_geojson = (railwayCode, properties) => {
  let data = {};
  try{
    const pathNum = db.prepare(`
      SELECT COUNT(DISTINCT pathId) AS num
      FROM RailPaths
      WHERE railwayCode = ?
    `).get(railwayCode).num;
    const stmt = db.prepare(`
      SELECT latitude, longitude FROM RailPaths
      WHERE railwayCode = ? AND pathId = ?
      ORDER BY ord
    `);
    data = {
      type: "Feature",
      geometry: {
        type: "MultiLineString",
        coordinates: [...Array(pathNum).keys()].map(pathId =>
          stmt.all(railwayCode, pathId).map(pos => [pos.longitude, pos.latitude])
        ),
      },
      properties: properties,
    };
  }catch(err){
    console.error(err);
    throw new Error("Server Error");
  }
  return data;
};

// 路線の線路のpathを取得
app.get("/api/railpaths/:railwayCode", accessLog, (req, res, next) => {
  const code = +req.params.railwayCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
  let data;
  try{
    const railwayInfo = db.prepare(`
      SELECT
        Railways.*,
        Companies.companyName,
        Companies.formalName AS companyFormalName
      FROM Railways
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
          AND Railways.railwayCode = ?
    `).get(code);
    data = get_railway_path_geojson(code, railwayInfo);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data);
});

// 会社に属する全路線の線路のpathを取得
app.get("/api/pathslist/:companyCode", accessLog, (req, res, next) => {
  const code = +req.params.companyCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
  let data;
  try{
    let railwayList;
    if(code === 0){
      railwayList = db.prepare(`
        SELECT
          Railways.*,
          Companies.companyName,
          Companies.formalName AS companyFormalName
        FROM Railways
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
            AND Railways.companyCode <= 6
      `).all();
    }else{
      railwayList = db.prepare(`
        SELECT
          Railways.*,
          Companies.companyName,
          Companies.formalName AS companyFormalName
        FROM Railways
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
            AND Railways.companyCode = ?
      `).all(code);
    }

    data = railwayList.map(elem =>
      get_railway_path_geojson(elem.railwayCode, elem));
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data);
});





////////// User //////////

const usersManager = new Users(db);


// 新規登録
app.get("/api/signin", accessLog, (req, res, next) => {
  const userName = req.body.userName;
  const userEmail = req.body.userEmail;
  const password = req.body.password;

  if(!userName || !userEmail || !password){
    next(new Error("Invalid input"));
    return;
  }
  try{
    const userData = db.prepare(`
      SELECT * FROM Users
      WHERE userEmail = ?
    `).get(userEmail);
    if(userData){
      next(new Error("Invalid input"));
      return;
    }
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  const sessionId = usersManager.signin(userName, userEmail, password);
  if(!sessionId){
    next(new Error("Server Error"));
    return;
  }
  res.cookie("sessionId", sessionId, {
    maxAge: 1000*60*60*24*30,
    httpOnly: true,
    secure: true,
  });
  res.json({ auth: true });
});


// ログイン
app.get("/api/login", accessLog, (req, res, next) => {
  const userEmail = req.body.userEmail;
  const password = req.body.password;

  if(!userEmail || !password){
    next(new Error("Invalid input"));
    return;
  }
  try{
    const userData = db.prepare(`
      SELECT * FROM Users
      WHERE userEmail = ?
    `).get(userEmail);
    if(!userData){
      next(new Error("Invalid input"));
      return;
    }
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  const sessionId = usersManager.login(userEmail, password);
  if(!sessionId){
    res.json({ auth: false });
    return;
  }
  res.cookie("sessionId", sessionId, {
    maxAge: 1000*60*60*24*20, // 20 days
    httpOnly: true,
    secure: true,
  });
  res.json({ auth: true });
});

// check
app.get("/api/status", accessLog, (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  if(!sessionId){
    res.json({
      auth: false,
      userName: undefined,
      userEmail: undefined,
    })
    return;
  }
  const userData = usersManager.status(sessionId);
  res.json({
    auth: userData !== undefined,
    userName: userData?.userName,
    userEmail: userData?.userEmail,
  });
});

// logout
app.get("/api/logout", accessLog, (req, res, next) => {
  const sessionId = req.cookies.sessionId;
  if(!sessionId){
    next(new Error("Invalid input"));
    return;
  }
  usersManager.logout(sessionId);
  res.cookie("sessionId", "", {
    maxAge: 0,
    httpOnly: true,
    secure: true,
  });
  res.end("OK");
});






////////// History //////////


// 全体の乗降/通過の履歴を区間取得
app.get("/api/stationHistory", accessLog, (req, res, next) => {
  const off = +req.query.off;
  const len = +req.query.len;
  const name = req.query.name ?? "";
  const type = req.query.type;
  if(isNaN(off) || isNaN(len)){
    next(new Error("Invalid input"));
    return;
  }
  let data;
  try{
    if(type === "station" && name !== ""){
      data = db.prepare(`
        SELECT
          Stations.*,
          StationGroups.stationName,
          StationGroups.kana,
          Prefectures.code AS prefCode,
          Prefectures.name AS prefName,
          Railways.railwayName,
          Railways.railwayCode,
          Railways.railwayColor,
          Companies.companyCode,
          Companies.companyName AS railwayCompany,
          StationHistory.date,
          StationHistory.state
        FROM StationHistory
        INNER JOIN Stations
          ON StationHistory.stationCode = Stations.stationCode
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
            AND StationGroups.stationName = ?
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
        INNER JOIN Prefectures
          ON StationGroups.prefCode = Prefectures.code
        ORDER BY StationHistory.date DESC
        LIMIT ?
        OFFSET ?
      `).all(name, len, off);
    }else if(type === "railway" && name !== ""){
      data = db.prepare(`
        SELECT
          Stations.*,
          StationGroups.stationName,
          StationGroups.kana,
          Prefectures.code AS prefCode,
          Prefectures.name AS prefName,
          Railways.railwayName,
          Railways.railwayCode,
          Railways.railwayColor,
          Companies.companyCode,
          Companies.companyName AS railwayCompany,
          StationHistory.date,
          StationHistory.state
        FROM StationHistory
        INNER JOIN Stations
          ON StationHistory.stationCode = Stations.stationCode
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
            AND Railways.railwayName = ?
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
        INNER JOIN Prefectures
          ON StationGroups.prefCode = Prefectures.code
        ORDER BY StationHistory.date DESC
        LIMIT ?
        OFFSET ?
      `).all(name, len, off);
    }else if(type === "company" && name !== ""){
      data = db.prepare(`
        SELECT
          Stations.*,
          StationGroups.stationName,
          StationGroups.kana,
          Prefectures.code AS prefCode,
          Prefectures.name AS prefName,
          Railways.railwayName,
          Railways.railwayCode,
          Railways.railwayColor,
          Companies.companyCode,
          Companies.companyName AS railwayCompany,
          StationHistory.date,
          StationHistory.state
        FROM StationHistory
        INNER JOIN Stations
          ON StationHistory.stationCode = Stations.stationCode
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
            AND Companies.companyName = ?
        INNER JOIN Prefectures
          ON StationGroups.prefCode = Prefectures.code
        ORDER BY StationHistory.date DESC
        LIMIT ?
        OFFSET ?
      `).all(name, len, off);
    }else{
      data = db.prepare(`
        SELECT
          Stations.*,
          StationGroups.stationName,
          StationGroups.kana,
          Prefectures.code AS prefCode,
          Prefectures.name AS prefName,
          Railways.railwayName,
          Railways.railwayCode,
          Railways.railwayColor,
          Companies.companyCode,
          Companies.companyName AS railwayCompany,
          StationHistory.*
        FROM StationHistory
        INNER JOIN Stations
          ON StationHistory.stationCode = Stations.stationCode
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
        INNER JOIN Prefectures
          ON StationGroups.prefCode = Prefectures.code
        ORDER BY date DESC
        LIMIT ?
        OFFSET ?
      `).all(len, off);
    }

    data = data.map(station => insert_next_stations(station, station.stationCode));
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data);
});

// 全体の乗降/通過の履歴の個数を取得
app.get("/api/stationHistoryCount", accessLog, (req, res, next) => {
  const name = req.query.name ?? "";
  const type = req.query.type;
  let data;
  try{
    if(type === "station" && name !== ""){
      data = db.prepare(`
        SELECT COUNT(*) AS count FROM StationHistory
        INNER JOIN Stations
          ON StationHistory.stationCode = Stations.stationCode
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
            AND StationGroups.stationName = ?
      `).get(name);
    }else if(type === "railway" && name !== ""){
      data = db.prepare(`
        SELECT COUNT(*) AS count FROM StationHistory
        INNER JOIN Stations
          ON StationHistory.stationCode = Stations.stationCode
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
            AND Railways.railwayName = ?
      `).get(name);
    }else if(type === "company" && name !== ""){
      data = db.prepare(`
        SELECT COUNT(*) AS count FROM StationHistory
        INNER JOIN Stations
          ON StationHistory.stationCode = Stations.stationCode
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
            AND Companies.companyName = ?
      `).get(name);
    }else{
      data = db.prepare(`
        SELECT COUNT(*) AS count FROM StationHistory
      `).get();
    }
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json(data.count);
});

// 全体の乗降/通過の履歴と駅情報を取得
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
        StationGroups.kana,
        Prefectures.code AS prefCode,
        Prefectures.name AS prefName,
        Railways.railwayName,
        Railways.railwayCode,
        Railways.railwayColor,
        Companies.companyCode,
        Companies.companyName AS railwayCompany
      FROM StationHistory
      INNER JOIN Stations
        ON StationHistory.stationCode = Stations.stationCode
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
      INNER JOIN Prefectures
        ON StationGroups.prefCode = Prefectures.code
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
  const code = +req.params.stationCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
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
  const code = +req.params.stationGroupCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
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

// 路線の駅の個数と乗降/通過した駅の個数を取得
app.get("/api/railwayProgress/:railwayCode", accessLog, (req, res, next) => {
  const code = +req.params.railwayCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
  let stationNum, getOrPassStationNum;
  try{
    stationNum = db.prepare(`
      SELECT COUNT(*) AS num FROM Stations
      WHERE railwayCode = ?
    `).get(code);

    getOrPassStationNum = db.prepare(`
      SELECT COUNT(DISTINCT(StationHistory.stationCode)) AS num FROM StationHistory
      INNER JOIN Stations
        ON StationHistory.stationCode = Stations.stationCode
          AND Stations.railwayCode = ?
    `).get(code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json({ stationNum: stationNum.num, getOrPassStationNum: getOrPassStationNum.num });
});

// 会社の駅の個数と乗降/通過した駅の個数を取得
app.get("/api/companyProgress/:companyCode", accessLog, (req, res, next) => {
  const code = +req.params.companyCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
  let stationNum, getOrPassStationNum;
  try{
    stationNum = db.prepare(`
      SELECT COUNT(*) AS num FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
          AND Railways.companyCode = ?
    `).get(code);

    getOrPassStationNum = db.prepare(`
      SELECT COUNT(DISTINCT(StationHistory.stationCode)) AS num FROM StationHistory
      INNER JOIN Stations
        ON StationHistory.stationCode = Stations.stationCode
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
          AND Railways.companyCode = ?
    `).get(code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json({ stationNum: stationNum.num, getOrPassStationNum: getOrPassStationNum.num });
});

// 都道府県の駅の個数と乗降/通過した駅の個数を取得(駅グループを1つとはしない)
app.get("/api/prefProgress/:prefCode", accessLog, (req, res, next) => {
  const code = +req.params.prefCode;
  if(isNaN(code)){
    next(new Error("Invalid input"));
    return;
  }
  let stationNum, getOrPassStationNum;
  try{
    stationNum = db.prepare(`
      SELECT COUNT(*) AS num FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND StationGroups.prefCode = ?
    `).get(code);

    getOrPassStationNum = db.prepare(`
      SELECT COUNT(DISTINCT(StationHistory.stationCode)) AS num FROM StationHistory
      INNER JOIN Stations
        ON StationHistory.stationCode = Stations.stationCode
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND StationGroups.prefCode = ?
    `).get(code);
  }catch(err){
    console.error(err);
    next(new Error("Server Error"));
    return;
  }
  res.json({ stationNum: stationNum.num, getOrPassStationNum: getOrPassStationNum.num });
});

// 乗降/通過の情報を追加
app.get("/api/postStationDate", accessLog, (req, res, next) => {
  const code = +req.query.code;
  const date = convert_date(req.query.date);
  const state = +req.query.state;
  if(isNaN(code) || date === undefined || isNaN(state)){
    next(new Error("Invalid input"));
    return;
  }
  if(state < 0 || state >= 2){
    next(new RangeError("Invalid input"));
    return;
  }
  const value_name = ["getDate", "passDate"][state];
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
  const code = +req.query.code;
  const date = convert_date(req.query.date);
  if(isNaN(code) || date === undefined){
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
  const code = +req.query.code;
  const date = convert_date(req.query.date);
  const state = +req.query.state;
  if(isNaN(code) || date === undefined || isNaN(state)){
    next(new Error("Invalid input"));
    return;
  }
  if(state < 0 || state >= 2){
    next(new RangeError("Invalid input"));
    return;
  }
  const value_name = ["getDate", "passDate"][state];
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
  const code = +req.query.code;
  const date = convert_date(req.query.date);
  if(isNaN(code) || date === undefined){
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
