const fs = require("fs");
const sqlite3 = require("better-sqlite3");

if(process.argv.length <= 2){
  console.error("Argument Error: node export-sql.js [json-file-name]");
  process.exit(1);
}
const file_path = process.argv[2];

if(!fs.existsSync("./station.db")){
  console.error(`Error: ./station.db does not exist`);
  process.exit(1);
}

const db = sqlite3("./station.db");

let station_history = [], station_group_history = [];

const create_station_history = (station) => {
  const res = db.prepare(`
    SELECT date, state FROM StationHistory
    WHERE stationCode = ?
  `).all(station.stationCode);
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
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    INNER JOIN Companies
      ON Railways.companyCode = Companies.companyCode
    GROUP BY StationHistory.stationCode
  `).all();
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
    GROUP BY StationGroupHistory.stationGroupCode
  `).all();
  if(!res){
    console.error("Error");
    process.exit(1);
  }
  res.forEach(item => {
    delete item.date;
    create_station_group_history(item);
  });
})();


db.close();

const result_json = {
  station_history: station_history,
  station_group_history: station_group_history,
};
fs.writeFileSync(file_path, JSON.stringify(result_json, null, "  "));
