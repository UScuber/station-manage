const { db, usersManager } = require("../components/db");
const {
  AuthError,
  InputError,
  InvalidValueError,
  ServerError,
} = require("../components/custom-errors");
const { convert_date } = require("../components/lib");
const { insert_next_stations } = require("../components/lib");
const { export_sql } = require("../components/export-sql");
const { import_sql, check_json_format } = require("../components/import-sql");





// 駅の最新のアクセス日時を取得
// /api/latestStationHistory/:stationCode
exports.latestStationHistory = (req, res) => {
  const code = +req.params.stationCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  let data;
  try{
    const stmt = db.prepare(`
      SELECT date FROM LatestStationHistory
      WHERE stationCode = ? AND state = ? AND userId = ?
    `);
    data = {
      getDate: stmt.get(code, 0, userId)?.date ?? null,
      passDate: stmt.get(code, 1, userId)?.date ?? null,
    };
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(data);
};


// 路線に属する駅の最新のアクセス日時を取得
// /api/latestRailwayStationHistory/:railwayCode
exports.latestStationHistoryList = (req, res) => {
  const code = +req.params.railwayCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  let data;
  try{
    const stmt = db.prepare(`
      SELECT date FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
          AND Stations.railwayCode = ?
      LEFT JOIN LatestStationHistory
        ON Stations.stationCode = LatestStationHistory.stationCode
          AND LatestStationHistory.state = ?
          AND LatestStationHistory.userId = ?
    `);
    const getList = stmt.all(code, 0, userId);
    const passList = stmt.all(code, 1, userId);
    data = getList.map((getDate, idx) => ({
      getDate: getDate.date ?? null,
      passDate: passList[idx].date ?? null,
    }));
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(data);
};


// 駅グループの最新のアクセス日時を取得
// /api/latestStationGroupHistory/:stationGroupCode
exports.latestStationGroupHistory = (req, res) => {
  const code = +req.params.stationGroupCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  let data;
  try{
    const stmt = db.prepare(`
      SELECT date FROM LatestStationGroupHistory
      WHERE stationGroupCode = ? AND userId = ?
    `);
    data = {
      date: stmt.get(code, userId)?.date ?? null,
    };
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(data);
};


// 全体の乗降/通過の履歴を区間取得
// /api/stationHistory
exports.stationHistoryList = (req, res) => {
  const off = +req.query.off;
  const len = +req.query.len;
  const name = req.query.name ?? "";
  const type = req.query.type;
  const dateFrom = convert_date(req.query.dateFrom) ? convert_date(req.query.dateFrom).substr(0, 10) + " 00:00:00" : undefined;
  const dateTo = convert_date(req.query.dateTo) ? convert_date(req.query.dateTo).substr(0, 10) + " 23:59:59" : undefined;
  console.log(dateFrom, dateTo);

  if(isNaN(off) || isNaN(len)){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
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
            AND StationHistory.userId = ?
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
            AND StationGroups.stationName = ?
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
        INNER JOIN Prefectures
          ON StationGroups.prefCode = Prefectures.code
        WHERE StationHistory.date >= datetime(IFNULL(?, '0000-01-01 00:00:00'))
          AND StationHistory.date <= datetime(IFNULL(?, '9999-12-31 23:59:59'))
        ORDER BY StationHistory.date DESC
        LIMIT ?
        OFFSET ?
      `).all(userId, name, dateFrom, dateTo, len, off);
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
            AND StationHistory.userId = ?
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
            AND Railways.railwayName = ?
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
        INNER JOIN Prefectures
          ON StationGroups.prefCode = Prefectures.code
        WHERE StationHistory.date >= datetime(IFNULL(?, '0000-01-01 00:00:00'))
          AND StationHistory.date <= datetime(IFNULL(?, '9999-12-31 23:59:59'))
        ORDER BY StationHistory.date DESC
        LIMIT ?
        OFFSET ?
      `).all(userId, name, dateFrom, dateTo, len, off);
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
            AND StationHistory.userId = ?
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
            AND Companies.companyName = ?
        INNER JOIN Prefectures
          ON StationGroups.prefCode = Prefectures.code
        WHERE StationHistory.date >= datetime(IFNULL(?, '0000-01-01 00:00:00'))
          AND StationHistory.date <= datetime(IFNULL(?, '9999-12-31 23:59:59'))
        ORDER BY StationHistory.date DESC
        LIMIT ?
        OFFSET ?
      `).all(userId, name, dateFrom, dateTo, len, off);
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
          StationHistory.date,
          StationHistory.state
        FROM StationHistory
        INNER JOIN Stations
          ON StationHistory.stationCode = Stations.stationCode
            AND StationHistory.userId = ?
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
        INNER JOIN Prefectures
          ON StationGroups.prefCode = Prefectures.code
        WHERE StationHistory.date >= datetime(IFNULL(?, '0000-01-01 00:00:00'))
          AND StationHistory.date <= datetime(IFNULL(?, '9999-12-31 23:59:59'))
        ORDER BY date DESC
        LIMIT ?
        OFFSET ?
      `).all(userId, dateFrom, dateTo, len, off);
    }

    data = data.map(station => insert_next_stations(station, station.stationCode));
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(data);
};


// 全体の乗降/通過の履歴の個数を取得
// /api/stationHistoryCount
exports.stationHistoryCount = (req, res) => {
  const name = req.query.name ?? "";
  const type = req.query.type;
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  let data;
  try{
    if(type === "station" && name !== ""){
      data = db.prepare(`
        SELECT COUNT(*) AS count FROM StationHistory
        INNER JOIN Stations
          ON StationHistory.stationCode = Stations.stationCode
            AND StationHistory.userId = ?
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
            AND StationGroups.stationName = ?
      `).get(userId, name);
    }else if(type === "railway" && name !== ""){
      data = db.prepare(`
        SELECT COUNT(*) AS count FROM StationHistory
        INNER JOIN Stations
          ON StationHistory.stationCode = Stations.stationCode
            AND StationHistory.userId = ?
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
            AND Railways.railwayName = ?
      `).get(userId, name);
    }else if(type === "company" && name !== ""){
      data = db.prepare(`
        SELECT COUNT(*) AS count FROM StationHistory
        INNER JOIN Stations
          ON StationHistory.stationCode = Stations.stationCode
            AND StationHistory.userId = ?
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
            AND Companies.companyName = ?
      `).get(userId, name);
    }else{
      data = db.prepare(`
        SELECT COUNT(*) AS count FROM StationHistory
        WHERE StationHistory.userId = ?
      `).get(userId);
    }
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(data.count);
};


// 駅情報を付与した履歴を取得
// /api/stationHistoryAndInfo
exports.stationHistoryDetail = (req, res) => {
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  let data;
  try{
    data = db.prepare(`
      SELECT
        StationHistory.date,
        StationHistory.state,
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
          AND StationHistory.userId = ?
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
      INNER JOIN Prefectures
        ON StationGroups.prefCode = Prefectures.code
      ORDER BY date DESC
    `).all(userId);

    data = data.map(station => insert_next_stations(station, station.stationCode));
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(data);
};


// 駅の履歴を取得
// /api/stationHistory/:stationCode
exports.stationHistory = (req, res) => {
  const code = +req.params.stationCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  let data;
  try{
    data = db.prepare(`
      SELECT stationCode, date, state FROM StationHistory
      WHERE stationCode = ? AND userId = ?
      ORDER BY date DESC
    `).all(code, userId);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(data);
};


// 駅グループ全体の履歴を取得(各駅の行動も含める)
// /api/stationGroupHistory/:stationGroupCode
exports.stationGroupHistory = (req, res) => {
  const code = +req.params.stationGroupCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }
  let data;
  try{
    data = db.prepare(`
        SELECT
        StationGroupHistory.stationGroupCode,
          StationGroupHistory.date,
          2 AS state,
          '' AS railwayName,
          '' AS railwayColor,
          NULL AS stationCode
        FROM StationGroupHistory
        WHERE stationGroupCode = ? AND userId = ?
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
            AND StationHistory.userId = ?
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
      ORDER BY date DESC
    `).all(code, userId, code, userId);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(data);
};


// 駅グループを名前で検索、区間指定した時のグループの最新の履歴
// /api/searchStationGroupListHistory
exports.latestStationGroupHistoryList = (req, res) => {
  const off = +req.query.off;
  const len = +req.query.len;
  const name = req.query.name ?? "";
  if(isNaN(off) || isNaN(len)){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }
  let data;
  try{
    if(name === ""){
      data = db.prepare(`
        SELECT StationGroups.*, 0 AS ord FROM StationGroups
        LEFT JOIN LatestStationGroupHistory
          ON StationGroups.stationGroupCode = LatestStationGroupHistory.stationGroupCode
            AND LatestStationGroupHistory.userId = ?
        LIMIT ? OFFSET ?
      `).all(userId, len, off);
    }else{
      data = db.prepare(`
        WITH StationData AS (
          SELECT * FROM StationGroups
        )
        SELECT LatestStationGroupHistory.date FROM (
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
        LEFT JOIN LatestStationGroupHistory
          ON Results.stationGroupCode = LatestStationGroupHistory.stationGroupCode
            AND LatestStationGroupHistory.userId = ?
        GROUP BY Results.stationGroupCode
        ORDER BY Results.ord
        LIMIT ? OFFSET ?
      `).all(
        name,`${name}_%`,`_%${name}`,`_%${name}_%`,
        name,`${name}_%`,`_%${name}`,`_%${name}_%`,
        userId, len, off
      );
    }
  }catch(err){
    throw new ServerError("Server Error", err);
  }

  res.json(data);
};


// 路線の駅の個数と乗降/通過した駅の個数を取得
// /api/railwayProgress/:railwayCode
exports.railwayProgress = (req, res) => {
  const code = +req.params.railwayCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  let stationNum, getOrPassStationNum;
  try{
    stationNum = db.prepare(`
      SELECT COUNT(*) AS num FROM Stations
      WHERE railwayCode = ?
    `).get(code);

    getOrPassStationNum = db.prepare(`
      SELECT COUNT(DISTINCT
        CASE
          WHEN LatestStationHistory.date IS NULL THEN NULL
          ELSE LatestStationHistory.stationCode
        END
      ) AS num FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
          AND Stations.railwayCode = ?
      LEFT JOIN LatestStationHistory
        ON Stations.stationCode = LatestStationHistory.stationCode
          AND LatestStationHistory.userId = ?
    `).get(code, userId);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json({ stationNum: stationNum.num, getOrPassStationNum: getOrPassStationNum.num });
};


// 会社の各路線の駅の個数と乗降/通過した駅の個数を取得
// /api/railwayProgressList/:companyCode
exports.railwayProgressList = (req, res) => {
  const code = +req.params.companyCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  let stationNumList, getOrPassStationNumList;
  try{
    stationNumList = db.prepare(`
      SELECT COUNT(*) as num FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
          AND Railways.companyCode = ?
      GROUP BY Stations.railwayCode
      ORDER BY Stations.railwayCode
    `).all(code);

    getOrPassStationNumList = db.prepare(`
      SELECT COUNT(DISTINCT
        CASE
          WHEN LatestStationHistory.date IS NULL THEN NULL
          ELSE LatestStationHistory.stationCode
        END
      ) AS num FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
          AND Railways.companyCode = ?
      LEFT JOIN LatestStationHistory
        ON Stations.stationCode = LatestStationHistory.stationCode
          AND LatestStationHistory.userId = ?
      GROUP BY Stations.railwayCode
      ORDER BY Stations.railwayCode
    `).all(code, userId);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(stationNumList.map((elem, idx) => ({
    stationNum: elem.num,
    getOrPassStationNum: getOrPassStationNumList[idx].num,
  })));
};


// 指定された都道府県に駅がが存在する路線の駅の個数と乗降/通過した駅の個数を取得
// /api/prefRailwayProgressList/:prefCode
exports.railwayProgressListByPref = (req, res) => {
  const code = +req.params.prefCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  let stationNumList, getOrPassStationNumList;
  try{
    stationNumList = db.prepare(`
      WITH RailData AS (
        SELECT Stations.railwayCode FROM Stations
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
            AND StationGroups.prefCode = ?
        GROUP BY Stations.railwayCode
      )
      SELECT COUNT(*) AS num FROM Stations
      INNER JOIN RailData
        ON Stations.railwayCode = RailData.railwayCode
      GROUP BY Stations.railwayCode
      ORDER BY Stations.railwayCode
    `).all(code);

    getOrPassStationNumList = db.prepare(`
      WITH RailData AS (
        SELECT Stations.railwayCode FROM Stations
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
            AND StationGroups.prefCode = ?
        GROUP BY Stations.railwayCode
      )
      SELECT COUNT(DISTINCT
        CASE
          WHEN LatestStationHistory.date IS NULL THEN NULL
          ELSE LatestStationHistory.stationCode
        END
      ) AS num FROM Stations
      INNER JOIN RailData
        ON Stations.railwayCode = RailData.railwayCode
      LEFT JOIN LatestStationHistory
        ON Stations.stationCode = LatestStationHistory.stationCode
          AND LatestStationHistory.userId = ?
      GROUP BY Stations.railwayCode
      ORDER BY Stations.railwayCode
    `).all(code, userId);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(stationNumList.map((elem, idx) => ({
    stationNum: elem.num,
    getOrPassStationNum: getOrPassStationNumList[idx].num,
  })));
};


// 全会社の各路線の駅の個数と乗降/通過した駅の個数のリストを取得
// /api/railwayProgressList
exports.railwayProgressListAll = (req, res) => {
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  let stationNumList, getOrPassStationNumList;
  try{
    stationNumList = db.prepare(`
      SELECT COUNT(*) as num FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
      GROUP BY Stations.railwayCode
      ORDER BY Stations.railwayCode
    `).all();

    getOrPassStationNumList = db.prepare(`
      SELECT COUNT(DISTINCT
        CASE
          WHEN LatestStationHistory.date IS NULL THEN NULL
          ELSE LatestStationHistory.stationCode
        END
      ) AS num FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
      LEFT JOIN LatestStationHistory
        ON Stations.stationCode = LatestStationHistory.stationCode
          AND LatestStationHistory.userId = ?
      GROUP BY Stations.railwayCode
      ORDER BY Stations.railwayCode
    `).all(userId);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(stationNumList.map((elem, idx) => ({
    stationNum: elem.num,
    getOrPassStationNum: getOrPassStationNumList[idx].num,
  })));
};


// 会社の駅の個数と乗降/通過した駅の個数を取得
// /api/companyProgress/:companyCode
exports.companyProgress = (req, res) => {
  const code = +req.params.companyCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
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
      SELECT COUNT(DISTINCT
        CASE
          WHEN LatestStationHistory.date IS NULL THEN NULL
          ELSE LatestStationHistory.stationCode
        END
      ) AS num FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
          AND Railways.companyCode = ?
      LEFT JOIN LatestStationHistory
        ON Stations.stationCode = LatestStationHistory.stationCode
          AND LatestStationHistory.userId = ?
    `).get(code, userId);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json({ stationNum: stationNum.num, getOrPassStationNum: getOrPassStationNum.num });
};


// 全会社の駅の個数と乗降/通過した駅の個数のリストを取得
// /api/companyProgress
exports.companyProgressList = (req, res) => {
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  let stationNumList, getOrPassStationNumList;
  try{
    stationNumList = db.prepare(`
      SELECT COUNT(*) AS num FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
      GROUP BY Railways.companyCode
      ORDER BY Railways.companyCode
    `).all();

    getOrPassStationNumList = db.prepare(`
      SELECT COUNT(DISTINCT
        CASE
          WHEN LatestStationHistory.date IS NULL THEN NULL
          ELSE LatestStationHistory.stationCode
        END
      ) AS num FROM Stations
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
      LEFT JOIN LatestStationHistory
        ON Stations.stationCode = LatestStationHistory.stationCode
          AND LatestStationHistory.userId = ?
      GROUP BY Railways.companyCode
      ORDER BY Railways.companyCode
    `).all(userId);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(stationNumList.map((data, idx) => ({
    stationNum: data.num,
    getOrPassStationNum: getOrPassStationNumList[idx].num,
  })));
};


// 都道府県の駅の個数と乗降/通過した駅の個数を取得(駅グループを1つとはしない)
// /api/prefProgress/:prefCode
exports.prefProgress = (req, res) => {
  const code = +req.params.prefCode;
  if(isNaN(code)){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
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
      SELECT COUNT(DISTINCT
        CASE
          WHEN LatestStationHistory.date IS NULL THEN NULL
          ELSE LatestStationHistory.stationCode
        END
      ) AS num FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND StationGroups.prefCode = ?
      LEFT JOIN LatestStationHistory
        ON LatestStationHistory.stationCode = Stations.stationCode
          AND LatestStationHistory.userId = ?
    `).get(userId, code);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json({ stationNum: stationNum.num, getOrPassStationNum: getOrPassStationNum.num });
};


// 全国の駅の個数と乗降/通過した駅の個数を取得(駅グループを1つとはしない)
// /api/prefProgress
exports.prefProgressList = (req, res) => {
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  let stationNumList, getOrPassStationNumList;
  try{
    stationNumList = db.prepare(`
      SELECT COUNT(*) AS num FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
      GROUP BY StationGroups.prefCode
      ORDER BY StationGroups.prefCode
    `).all();

    getOrPassStationNumList = db.prepare(`
      SELECT COUNT(DISTINCT
        CASE
          WHEN LatestStationHistory.date IS NULL THEN NULL
          ELSE LatestStationHistory.stationCode
        END
      ) AS num FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
      LEFT JOIN LatestStationHistory
        ON LatestStationHistory.stationCode = Stations.stationCode
          AND LatestStationHistory.userId = ?
      GROUP BY StationGroups.prefCode
      ORDER BY StationGroups.prefCode
    `).all(userId);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.json(stationNumList.map((data, idx) => ({
    stationNum: data.num,
    getOrPassStationNum: getOrPassStationNumList[idx].num,
  })));
};


// 乗降/通過の情報を追加
// /api/postStationDate
exports.postStationDate = (req, res) => {
  const code = +req.query.code;
  const date = convert_date(req.query.date);
  const state = +req.query.state;
  if(isNaN(code) || date === undefined || isNaN(state)){
    throw new InputError("Invalid input");
  }
  if(state < 0 || state >= 2){
    throw new InvalidValueError("Invalid value");
    return;
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  try{
    db.prepare(
      "INSERT INTO StationHistory VALUES(?, datetime(?), ?, ?)"
    ).run(code, date, state, userId);

    db.prepare(`
      INSERT INTO LatestStationHistory VALUES(?, datetime(?), ?, ?)
      ON CONFLICT(stationCode, state, userId)
      DO UPDATE SET date = MAX(IFNULL(date, 0), datetime(?))
    `).run(code, date, state, userId, date);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.end("OK");
};


// 立ち寄りの情報を追加
// /api/postStationGroupDate
exports.postStationGroupDate = (req, res) => {
  const code = +req.query.code;
  const date = convert_date(req.query.date);
  if(isNaN(code) || date === undefined){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  try{
    db.prepare(`
      INSERT INTO StationGroupHistory VALUES(?, datetime(?), ?)
    `).run(code, date, userId);

    const cnt = db.prepare(`
      SELECT COUNT(*) AS cnt FROM LatestStationGroupHistory
      WHERE stationGroupCode = ? AND userId = ?
    `).get(code, userId).cnt;

    if(cnt){
      db.prepare(`
        UPDATE LatestStationGroupHistory SET date = MAX(IFNULL(date, 0), datetime(?))
        WHERE stationGroupCode = ? AND userId = ?
      `).run(date, code, userId);
    }else{
      db.prepare(`
        INSERT INTO LatestStationGroupHistory VALUES(?, datetime(?), ?)
      `).run(code, date, userId);
    }
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.end("OK");
};


// 乗降/通過の履歴を削除
// /api/deleteStationDate
exports.deleteStationDate = (req, res) => {
  const code = +req.query.code;
  const date = convert_date(req.query.date);
  const state = +req.query.state;
  if(isNaN(code) || date === undefined || isNaN(state)){
    throw new InputError("Invalid input");
  }
  if(state < 0 || state >= 2){
    throw new InvalidValueError("Invalid value");
    return;
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  try{
    db.prepare(`
      DELETE FROM StationHistory
      WHERE stationCode = ? AND date = datetime(?) AND state = ? AND userId = ?
    `).run(code, date, state, userId);

    // 要素が何もなければNULLが入る
    db.prepare(`
      UPDATE LatestStationHistory SET date = (
        SELECT MAX(date) FROM StationHistory
        WHERE stationCode = ? AND state = ? AND userId = ?
      )
      WHERE stationCode = ? AND state = ? AND userId = ?
    `).run(code, state, userId, code, state, userId);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.end("OK");
};


// 立ち寄りの履歴を削除
// /api/deleteStationGroupState
exports.deleteStationGroupDate = (req, res) => {
  const code = +req.query.code;
  const date = convert_date(req.query.date);
  if(isNaN(code) || date === undefined){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  try{
    db.prepare(`
      DELETE FROM StationGroupHistory
      WHERE stationGroupCode = ? AND date = datetime(?) AND userId = ?
    `).run(code, date, userId);

    // 要素が何もなければNULLが入る
    db.prepare(`
      UPDATE LatestStationGroupHistory SET date = (
        SELECT MAX(date) FROM StationGroupHistory
        WHERE stationGroupCode = ? AND userId = ?
      )
      WHERE stationGroupCode = ? AND userId = ?
    `).run(code, userId, code, userId);
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  res.end("OK");
};


// 履歴のエクスポート
// /api/exportHistory
exports.exportHistory = (req, res) => {
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  const data = export_sql(db, userId);
  res.json(data);
};


// 履歴のインポート
// /api/importHistory
exports.importHistory = (req, res) => {
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }

  const data = req.body;
  if(!check_json_format(data)){
    throw new InputError("Invalid input");
  }
  import_sql(db, data, userId);
  res.end("OK");
};
