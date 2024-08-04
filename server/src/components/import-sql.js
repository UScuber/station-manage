// 履歴データを取り込む
const import_sql = (db, input_json, userId) => {

  // [latitude, longitude]
  const distance = (p1, p2) => {
    const R = Math.PI / 180;
    return Math.acos(Math.cos(p1[0]*R) * Math.cos(p2[0]*R) * Math.cos(p2[1]*R - p1[1]*R) + Math.sin(p1[0]*R) * Math.sin(p2[0]*R)) * 6371;
  };

  db.function("dist", (lat1,lng1,lat2,lng2) => distance([lat1,lng1],[lat2,lng2]));


  // 現在の履歴の削除
  db.prepare("DELETE FROM StationHistory WHERE userId = ?").run(userId);
  db.prepare("DELETE FROM StationGroupHistory WHERE userId = ?").run(userId);
  db.prepare("DELETE FROM LatestStationHistory WHERE userId = ?").run(userId);
  db.prepare("DELETE FROM LatestStationGroupHistory WHERE userId = ?").run(userId);

  let unknown_history = { station_history: [], station_group_history: [] };

  db.transaction(() => {
    input_json.station_history.forEach(data => {
      const res = db.prepare(`
        SELECT * FROM Stations
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
            AND StationGroups.stationName = ?
        INNER JOIN Railways
          ON Stations.railwayCode = Railways.railwayCode
            AND Railways.railwayName = ?
        INNER JOIN Companies
          ON Railways.companyCode = Companies.companyCode
            AND Companies.companyName = ?
      `)
        .get(data.info.stationName, data.info.railwayName, data.info.companyName ?? data.info.railwayCompany);
      if(res){
        data.history.forEach(elem => {
          db.prepare("INSERT INTO StationHistory VALUES(?, datetime(?), ?, ?)")
            .run(res.stationCode, elem.date, elem.state, userId);
        });
      }else{
        unknown_history.station_history.push({
          history: data.history,
          info: data.info,
          query: data.history.map(hist => `postStationDate?state=${hist.state}&date=${hist.date}&code=`)
        });
      }
    });
  })();

  // stations最終アクセスの更新
  db.prepare(`
    INSERT INTO LatestStationHistory(stationCode, date, state, userId)
    SELECT stationCode, MAX(date), state, userId
    FROM StationHistory
    WHERE userId = ?
    GROUP BY stationCode, state
    HAVING MAX(date) IS NOT NULL
  `).run(userId);


  db.transaction(() => {
    input_json.station_group_history.forEach(data => {
      // 同じ駅名で、座標が一番近いものを探す
      const res = db.prepare(`
        SELECT * FROM StationGroups
        WHERE stationName = ? AND dist(latitude,longitude,?,?) = (
          SELECT MIN(dist(latitude,longitude,?,?)) FROM StationGroups
        )
      `)
        .get(
          data.info.stationName,
          data.info.latitude, data.info.longitude,
          data.info.latitude, data.info.longitude
        );
      if(res){
        data.history.forEach(elem => {
          db.prepare("INSERT INTO StationGroupHistory VALUES(?, datetime(?), ?)")
            .run(res.stationGroupCode, elem.date, userId);
        });
      }else{
        unknown_history.station_group_history.push({
          history: data.history,
          info: data.info,
          query: data.history.map(hist => `postStationGroupDate?date=${hist.date}&code=`)
        });
      }
    });
  })();

  // stationgroups最終アクセスの更新
  db.prepare(`
    INSERT INTO LatestStationGroupHistory(stationGroupCode, date, userId)
    SELECT stationGroupCode, MAX(date), userId
    FROM StationGroupHistory
    WHERE userId = ?
    GROUP BY stationGroupCode
    HAVING MAX(date) IS NOT NULL
  `).run(userId);


  unknown_history.station_history = unknown_history.station_history.sort((a, b) => new Date(a.history[0].date) < new Date(b.history[0].date) ? -1 : 1);
  unknown_history.station_group_history = unknown_history.station_group_history.sort((a, b) => new Date(a.history[0].date) < new Date(b.history[0].date) ? -1 : 1);
  return unknown_history;
};



// 履歴のjsonの形式をチェックする
const check_json_format = (json) => {
  if(!("station_history" in json)) return false;
  if(!("station_group_history" in json)) return false;
  if(!Array.isArray(json.station_history)) return false;
  if(!Array.isArray(json.station_group_history)) return false;

  // station history
  for(let i = 0; i < json.station_history.length; i++){
    const history = json.station_history[i];
    if(!("history" in history)) return false;
    if(!("info" in history)) return false;
    if(!Array.isArray(history.history)) return false;
    for(let j = 0; j < history.history.length; j++){
      if(!("date" in history.history[j])) return false;
      if(!("state" in history.history[j])) return false;
    }
    if(!("railwayCode" in history.info)) return false;
    if(!("latitude" in history.info)) return false;
    if(!("longitude" in history.info)) return false;
    if(!("railwayName" in history.info)) return false;
    if(!("companyName" in history.info)) return false;
  }

  // station group history
  for(let i = 0; i < json.station_group_history.length; i++){
    const history = json.station_group_history[i];
    if(!("history" in history)) return false;
    if(!("info" in history)) return false;
    if(!Array.isArray(history.history)) return false;
    for(let j = 0; j < history.history.length; j++){
      if(!("date" in history.history[j])) return false;
    }
    if(!("stationName" in history.info)) return false;
    if(!("latitude" in history.info)) return false;
    if(!("longitude" in history.info)) return false;
  }
  return true;
};



const import_stationURL = (db, input_json) => {
  db.transaction(() => {
    db.prepare("DELETE FROM TimetableLinks").run();
    input_json.data.forEach(data => {
      if(!data.stationCode) return;
      data.timetable.forEach(timedata => {
        if(!timedata.direction || !timedata.url) return;
        db.prepare(`
          INSERT INTO TimetableLinks VALUES(?, ?, ?)
        `).run(data.stationCode, timedata.direction, timedata.url);
      });
      db.prepare(`
        UPDATE TrainPosLinks SET url = ?
        WHERE stationCode = ?
      `).run(data.trainPosURL ?? null, data.stationCode);
    });
  })();
};


exports.import_sql = import_sql;
exports.check_json_format = check_json_format;
exports.import_stationURL = import_stationURL;
