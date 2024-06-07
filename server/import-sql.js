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
  db.transaction(() => {
    const stations = db.prepare(`
      SELECT stationCode FROM Stations
    `).all();
    const get_num_stmt = db.prepare(`
      SELECT COUNT(*) as num FROM StationHistory
      WHERE stationCode = ? AND state = ? AND userId = ?
    `);
    const get_max_date = db.prepare(`
      SELECT MAX(date) as max FROM StationHistory
      WHERE stationCode = ? AND state = ? AND userId = ?
    `);
    const insert_stmt = db.prepare(`
      INSERT INTO LatestStationHistory VALUES(?, datetime(?), ?, ?)
    `);

    stations.forEach(({ stationCode }) => {
      const get_num = get_num_stmt.get(stationCode, 0, userId).num;
      if(get_num){
        const date = get_max_date.get(stationCode, 0, userId).max;
        insert_stmt.run(stationCode, date, 0, userId);
      }
      const pass_num = get_num_stmt.get(stationCode, 1, userId).num;
      if(pass_num){
        const date = get_max_date.get(stationCode, 1, userId).max;
        insert_stmt.run(stationCode, date, 1, userId);
      }
    });
  })();


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
  db.transaction(() => {
    const stationGroups = db.prepare(`
      SELECT stationGroupCode FROM StationGroups
    `).all();
    const get_num_stmt = db.prepare(`
      SELECT COUNT(*) as num FROM StationGroupHistory
      WHERE stationGroupCode = ? AND userId = ?
    `);
    const get_max_date = db.prepare(`
      SELECT MAX(date) as max FROM StationGroupHistory
      WHERE stationGroupCode = ? AND userId = ?
    `);
    const insert_stmt = db.prepare(`
      INSERT INTO LatestStationGroupHistory VALUES(?, ?, ?)
    `);

    stationGroups.forEach(({ stationGroupCode }) => {
      const num = get_num_stmt.get(stationGroupCode, userId).num;
      if(num){
        const date = get_max_date.get(stationGroupCode, userId).max;
        insert_stmt.run(stationGroupCode, date, userId);
      }
    });
  })();


  unknown_history.station_history = unknown_history.station_history.sort((a, b) => new Date(a.history[0].date) < new Date(b.history[0].date) ? -1 : 1);
  unknown_history.station_group_history = unknown_history.station_group_history.sort((a, b) => new Date(a.history[0].date) < new Date(b.history[0].date) ? -1 : 1);
  return unknown_history;
};


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


exports.import_sql = import_sql;
exports.check_json_format = check_json_format;
