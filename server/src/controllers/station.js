const { db, usersManager } = require("../components/db");
const {
  InputError,
  InvalidValueError,
  ServerError,
  AuthError,
} = require("../components/custom-errors");
const {
  insert_next_stations,
  set_cache_control,
} = require("../components/lib");
const { export_stationURL } = require("../components/export-sql");
const { import_stationURL } = require("../components/import-sql");



// 駅情報取得
// /api/station/:stationCode
exports.station = (req, res) => {
  const code = +req.params.stationCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
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
    throw new ServerError("Server Error", err);
  }

  if(!data){
    throw new InvalidValueError("Invalid value");
  }else{
    set_cache_control(res);
    res.json(data);
  }
};


// 駅グループの情報取得
// /api/stationGroup/:stationGroupCode
exports.groupStations = (req, res) => {
  const code = +req.params.stationGroupCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  let data;
  try{
    data = db.prepare(`
      SELECT
        StationGroups.*,
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
    throw new ServerError("Server Error", err);
  }

  if(!data){
    throw new InvalidValueError("Invalid value");
  }else{
    set_cache_control(res);
    res.json(data);
  }
};


// 駅グループに属する駅の駅情報を取得
// /api/stationsByGroupCode/:stationGroupCode
exports.stationGroup = (req, res) => {
  const code = +req.params.stationGroupCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  let data;
  try{
    data = db.prepare(`
      SELECT
        Stations.*,
        StationGroups.stationName,
        StationGroups.kana,
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
    throw new ServerError("Server Error", err);
  }

  if(!data.length){
    throw new InvalidValueError("Invalid value");
  }else{
    set_cache_control(res);
    res.json(data);
  }
};


// 路線情報取得
// /api/railway/:railwayCode
exports.railway = (req, res) => {
  const code = +req.params.railwayCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
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
    throw new ServerError("Server Error", err);
  }

  if(!data){
    throw new InvalidValueError("Invalid value");
  }else{
    set_cache_control(res);
    res.json(data);
  }
};


// 路線情報全取得
// /api/railway
exports.railways = (req, res) => {
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
    throw new ServerError("Server Error", err);
  }

  set_cache_control(res);
  res.json(data);
};


// 路線に属する駅の駅情報を取得
// /api/railwayStations/:railwayCode
exports.railwayStations = (req, res) => {
  const code = +req.params.railwayCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
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
    throw new ServerError("Server Error", err);
  }

  if(!data.length){
    throw new InvalidValueError("Invalid value");
  }else{
    set_cache_control(res);
    res.json(data);
  }
};


// 会社情報取得
// /api/company/:companyCode
exports.company = (req, res) => {
  const code = +req.params.companyCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
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
    throw new ServerError("Server Error", err);
  }

  if(!data){
    throw new InvalidValueError("Invalid value");
  }else{
    set_cache_control(res);
    res.json(data);
  }
};


// 会社情報全取得
// /api/company
exports.companies = (req, res) => {
  let data;
  try{
    data = db.prepare(`
      SELECT * FROM Companies
      ORDER BY companyCode
    `).all();
  }catch(err){
    throw new ServerError("Server Error", err);
  }

  if(!data){
    throw new InvalidValueError("Invalid value");
  }else{
    set_cache_control(res);
    res.json(data);
  }
};


// 会社に属する路線の路線情報を取得
// /api/companyRailways/:companyCode
exports.companyRailways = (req, res) => {
  const code = +req.params.companyCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  let data;
  try{
    if(code === 0){
      data = db.prepare(`
        SELECT * FROM Railways
        WHERE companyCode <= 6
        ORDER BY railwayCode
      `).all();
    }else{
      data = db.prepare(`
        SELECT * FROM Railways
        WHERE companyCode = ?
        ORDER BY railwayCode
      `).all(code);
    }
  }catch(err){
    throw new ServerError("Server Error", err);
  }

  if(!data){
    throw new InvalidValueError("Invalid value");
  }else{
    set_cache_control(res);
    res.json(data);
  }
};


// 会社に属する路線の駅情報を全取得
// /api/companyStations/:companyCode
exports.companyStations = (req, res) => {
  const code = +req.params.companyCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
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
    throw new ServerError("Server Error", err);
  }

  if(!data){
    throw new InvalidValueError("Invalid value");
  }else{
    set_cache_control(res);
    res.json(data);
  }
};


// 県に属する路線の路線情報を取得
// /api/prefRailways/:prefCode
exports.prefRailways = (req, res) => {
  const code = +req.params.prefCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
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
    throw new ServerError("Server Error", err);
  }

  if(!data){
    throw new InvalidValueError("Invalid value");
  }else{
    set_cache_control(res);
    res.json(data);
  }
};


// 県に属する路線の駅情報を全取得
// /api/prefStations/:prefCode
exports.prefStations = (req, res) => {
  const code = +req.params.prefCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
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
    throw new ServerError("Server Error", err);
  }

  if(!data){
    throw new InvalidValueError("Invalid value");
  }else{
    set_cache_control(res);
    res.json(data);
  }
};


// 駅グループを名前で検索、区間指定
// /api/searchStationGroupList
exports.stationGroupList = (req, res) => {
  const off = +req.query.off;
  const len = +req.query.len;
  const name = req.query.name ?? "";
  if(isNaN(off) || isNaN(len)){
    throw new InputError("Invalid input");
  }
  let data;
  try{
    if(name === ""){
      data = db.prepare(`
        SELECT
          StationGroups.*,
          Prefectures.code AS prefCode,
          Prefectures.name AS prefName,
          0 AS ord
        FROM StationGroups
        INNER JOIN Prefectures
          ON StationGroups.prefCode = Prefectures.code
        LIMIT ? OFFSET ?
      `).all(len, off);
    }else{
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
    }
  }catch(err){
    throw new ServerError("Server Error", err);
  }

  res.json(data);
};


// 駅グループを名前で検索した際の件数
// /api/searchStationGroupCount
exports.stationGroupCount = (req, res) => {
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
    throw new ServerError("Server Error", err);
  }

  res.json(data.count);
};


// 座標から近い駅/駅グループを複数取得
// /api/searchNearestStationGroup
exports.searchKNearestStationGroups = (req, res) => {
  const lat = +req.query.lat;
  const lng = +req.query.lng;
  const num = req.query.num ? Math.min(parseInt(req.query.num), 20) : 20;
  if(isNaN(lat) || isNaN(lng)){
    throw new InputError("Invalid input");
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
    throw new ServerError("Server Error", err);
  }

  res.json(data);
};



// 都道府県名を取得
// /api/pref/:prefCode
exports.prefecture = (req, res) => {
  const code = +req.params.prefCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
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
    throw new ServerError("Server Error", err);
  }

  set_cache_control(res);
  res.json(data);
};

// 都道府県名を全取得
// /api/pref
exports.prefectures = (req, res) => {
  try{
    data = db.prepare(`
      SELECT
        Prefectures.code AS prefCode,
        Prefectures.name AS prefName
      FROM Prefectures
    `).all();
  }catch(err){
    throw new ServerError("Server Error", err);
  }

  set_cache_control(res);
  res.json(data);
};


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
// /api/railpaths/:railwayCode
exports.railPath = (req, res) => {
  const code = +req.params.railwayCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
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
    throw new ServerError("Server Error", err);
  }

  set_cache_control(res);
  res.json(data);
};


// 会社に属する全路線の線路のpathを取得
// /api/pathslist/:companyCode
exports.railPathList = (req, res) => {
  const code = +req.params.companyCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
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
    throw new ServerError("Server Error", err);
  }

  set_cache_control(res);
  res.json(data);
};


// 時刻表のURL追加更新(admin)
// /api/updateTimetableURL
exports.updateTimetableURL = (req, res) => {
  const code = +req.query.code;
  const direction = req.query.direction;
  const mode = req.query.mode;
  const url = req.query.url || null;
  if(isNaN(code) || !direction || !["update", "delete"].includes(mode)){
    throw new InputError("Invalid input");
  }
  if(mode === "update" && url === undefined){
    throw new InputError("Invalid input");
  }
  const { userId, isAdmin } = usersManager.getUserData(req);
  if(!userId || !isAdmin){
    throw new AuthError("Unauthorized");
  }

  try{
    if(mode === "update"){
      db.prepare(`
        INSERT INTO TimetableLinks VALUES(?, ?, ?)
        ON CONFLICT(stationCode, direction, url)
        DO UPDATE SET url = ?
      `).run(code, direction, url, url);
    }else{
      db.prepare(`
        DELETE FROM TimetableLinks
        WHERE stationCode = ? AND direction = ?
      `).run(code, direction);
    }
  }catch(err){
    throw new ServerError("Server Error", err);
  }

  res.end("OK");
};


// 列車走行位置のURL追加更新(admin)
exports.updateTrainPosURL = (req, res) => {
  const code = +req.query.code;
  const url = req.query.url;
  if(isNaN(code) || url === undefined){
    throw new InputError("Invalid input");
  }

  try{
    db.prepare(`
      UPDATE TrainPosLinks SET url = ?
      WHERE stationCode = ?
    `).run(url, code);
  }catch(err){
    throw new ServerError("Server Error", err);
  }

  res.end("OK");
};


// 時刻表と走行位置のURLのexport(admin)
// /api/exportStationURL
exports.exportStationURL = (req, res) => {
  const { userId, isAdmin } = usersManager.getUserData(req);
  if(!userId || !isAdmin){
    throw new AuthError("Unauthorized");
  }

  let data;
  try {
    data = export_stationURL(db);
  }catch(err){
    throw new ServerError("Server Error", err);
  }

  res.json(data);
};


// 時刻表と走行位置のURLのimport(admin)
// /api/importStationURL
exports.importStationURL = (req, res) => {
  const { userId, isAdmin } = usersManager.getUserData(req);
  if(!userId || !isAdmin){
    throw new AuthError("Unauthorized");
  }

  const data = req.body;
  try {
    import_stationURL(db, data);
  }catch(err){
    throw new ServerError("Server Error", err);
  }

  res.end("OK");
};
