const fs = require("fs");
const sqlite3 = require("sqlite3");

if(process.argv.length <= 2){
  console.error("Argument Error: node export-sql.js [json-file-name]");
  process.exit(1);
}

if(!fs.existsSync("./station.db")){
  console.error(`Error: ./station.db does not exist`);
  process.exit(1);
}

const db = new sqlite3.Database("./station.db");

let station_history = [], station_group_history = [];

const create_station_history = (station) => {
  db.all(`
    SELECT date, state FROM StationHistory
    WHERE stationCode = ?
    `,
    station.stationCode,
    (err, data) => {
      if(err){
        console.error(err);
        process.exit(1);
      }
      delete station.stationCode; // ID以外の情報を参考にする
      station_history.push({
        history: data,
        info: station,
      });
    }
  );
};

db.all(`
  SELECT Stations.*, StationGroups.stationName FROM StationHistory
  INNER JOIN Stations ON StationHistory.stationCode = Stations.stationCode
  INNER JOIN StationGroups ON Stations.stationGroupCode = StationGroups.stationGroupCode
  GROUP BY StationHistory.stationCode
  `,
  (err, data) => {
    if(err){
      console.error(err);
      process.exit(1);
    }
    data.forEach(item => {
      delete item.getDate;
      delete item.passDate;
      create_station_history(item);
    });
  }
);


const create_station_group_history = (station) => {
  db.all(`
    SELECT date FROM StationGroupHistory
    WHERE stationGroupCode = ?
    `,
    station.stationGroupCode,
    (err, data) => {
      if(err){
        console.error(err);
        process.exit(1);
      }
      delete station.stationGroupCode; // ID以外の情報を参考にする
      station_group_history.push({
        history: data,
        info: station,
      });
    }
  );
};

db.all(`
  SELECT StationGroups.* FROM StationGroupHistory
  INNER JOIN StationGroups ON StationGroupHistory.stationGroupCode = StationGroups.stationGroupCode
  GROUP BY StationGroupHistory.stationGroupCode
  `,
  (err, data) => {
    if(err){
      console.error(err);
      process.exit(1);
    }
    data.forEach(item => {
      delete item.date;
      create_station_group_history(item);
    });
  }
);


db.close(() => {
  const file_path = process.argv[2];
  const result_json = {
    station_history: station_history,
    station_group_history: station_group_history,
  };
  fs.writeFileSync(file_path, JSON.stringify(result_json, null, " "));
});
