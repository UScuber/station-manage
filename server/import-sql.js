// convert-geojson.js実行後のSQLに入れる

const fs = require("fs");
const sqlite3 = require("better-sqlite3");

if(process.argv.length <= 2){
  console.error("Argument Error: node import-sql.js [json-file-name]");
  process.exit(1);
}
const file_path = process.argv[2];
if(!fs.existsSync(file_path)){
  console.error(`Error: ${file_path} does not exist`);
  process.exit(1);
}
if(!fs.existsSync("./station.db")){
  console.error(`Error: ./station.db does not exist`);
  process.exit(1);
}

const db = sqlite3("./station.db");
db.pragma("journal_mode = WAL");

const input_json = JSON.parse(fs.readFileSync(file_path));

// [latitude, longitude]
const distance = (p1, p2) => {
  const R = Math.PI / 180;
  return Math.acos(Math.cos(p1[0]*R) * Math.cos(p2[0]*R) * Math.cos(p2[1]*R - p1[1]*R) + Math.sin(p1[0]*R) * Math.sin(p2[0]*R)) * 6371;
};

db.function("dist", (lat1,lng1,lat2,lng2) => distance([lat1,lng1],[lat2,lng2]));


// 現在の履歴の削除
db.prepare("DELETE FROM StationHistory").run();
db.prepare("DELETE FROM StationGroupHistory").run();

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
        db.prepare("INSERT INTO StationHistory VALUES(?, datetime(?), ?)")
          .run(res.stationCode, elem.date, elem.state);
      });
    }else{
      // 座標から探す
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
  db.prepare(`
    UPDATE Stations SET
      getDate = (
        SELECT MAX(date) FROM StationHistory
        WHERE StationHistory.stationCode = Stations.stationCode
          AND state = 0
      ),
      passDate = (
        SELECT MAX(date) FROM StationHistory
        WHERE StationHistory.stationCode = Stations.stationCode
          AND state = 1
      )
  `).run();
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
        db.prepare("INSERT INTO StationGroupHistory VALUES(?, datetime(?))")
          .run(res.stationGroupCode, elem.date);
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
  db.prepare(`
    UPDATE StationGroups SET
      date = (
        SELECT MAX(date) FROM StationGroupHistory
        WHERE StationGroupHistory.stationGroupCode = StationGroups.stationGroupCode
      )
  `).run();
})();

unknown_history.station_history = unknown_history.station_history.sort((a, b) => new Date(a.history[0].date) < new Date(b.history[0].date) ? -1 : 1);
unknown_history.station_group_history = unknown_history.station_group_history.sort((a, b) => new Date(a.history[0].date) < new Date(b.history[0].date) ? -1 : 1);
fs.writeFileSync("unknown-history.json", JSON.stringify(unknown_history, null, "  "));
