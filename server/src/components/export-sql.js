// 履歴を出力する
const export_sql = (db, userId) => {
  let station_history = [], station_group_history = [];

  const create_station_history = (station) => {
    const res = db.prepare(`
      SELECT date, state FROM StationHistory
      WHERE stationCode = ? AND userId = ?
    `).all(station.stationCode, userId);
    if(!res){
      console.error("Error");
      process.exit(1);
    }
    delete station.stationCode; // ID以外の情報を参考にする
    station_history.push({
      history: res,
      info: station,
    });
  };


  db.transaction(() => {
    const res = db.prepare(`
      SELECT
        Stations.*,
        StationGroups.stationName,
        Railways.railwayName,
        Companies.companyName
      FROM StationHistory
      INNER JOIN Stations
        ON StationHistory.stationCode = Stations.stationCode
          AND userId = ?
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
      INNER JOIN Railways
        ON Stations.railwayCode = Railways.railwayCode
      INNER JOIN Companies
        ON Railways.companyCode = Companies.companyCode
      GROUP BY StationHistory.stationCode
    `).all(userId);
    if(!res){
      console.error("Error");
      process.exit(1);
    }
    res.forEach(item => {
      delete item.getDate;
      delete item.passDate;
      create_station_history(item);
    });
  })();


  const create_station_group_history = (station) => {
    const res = db.prepare(`
      SELECT date FROM StationGroupHistory
      WHERE stationGroupCode = ?
    `).all(station.stationGroupCode);
    if(!res){
      console.error("Error");
      process.exit(1);
    }
    delete station.stationGroupCode; // ID以外の情報を参考にする
    station_group_history.push({
      history: res,
      info: station,
    });
  };

  db.transaction(() => {
    const res = db.prepare(`
      SELECT StationGroups.* FROM StationGroupHistory
      INNER JOIN StationGroups
        ON StationGroupHistory.stationGroupCode = StationGroups.stationGroupCode
          AND userId = ?
      GROUP BY StationGroupHistory.stationGroupCode
    `).all(userId);
    if(!res){
      console.error("Error");
      process.exit(1);
    }
    res.forEach(item => {
      delete item.date;
      create_station_group_history(item);
    });
  })();


  const result_json = {
    station_history: station_history,
    station_group_history: station_group_history,
  };
  return result_json;
};



// 駅の情報のURLを出力する
const export_stationURL = (db) => {
  const stations = db.prepare(`
    SELECT stationCode FROM Stations
  `).all();
  const data = stations.map(station => ({
    stationCode: station.stationCode,
    timetable: db.prepare(`
        SELECT direction, url FROM TimetableLinks
        WHERE stationCode = ?
      `).all(station.stationCode),
    trainPosURL: db.prepare(`
        SELECT url FROM TrainPosLinks
        WHERE stationCode = ?
      `).get(station.stationCode)?.url ?? null,
  }));
  return {
    data: data,
  };
};


exports.export_sql = export_sql;
exports.export_stationURL = export_stationURL;
