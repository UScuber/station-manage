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

db.transaction(() => {
  input_json.station_history.forEach(data => {
    const res = db.prepare(`
      SELECT * FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND StationGroups.stationName = ?
          AND Stations.railwayName = ?
          AND Stations.railwayCompany = ?
    `)
      .get(data.info.stationName, data.info.railwayName, data.info.railwayCompany);
    if(res){
      data.history.forEach(elem => {
        db.prepare("INSERT INTO StationHistory VALUES(?, datetime(?), ?)")
          .run(res.stationCode, elem.date, elem.state);
      });
    }else{
      // 座標から探す
      const nearest = db.prepare(`
        SELECT * FROM Stations
        WHERE dist(latitude,longitude,?,?) = (
          SELECT MIN(dist(latitude,longitude,?,?)) FROM Stations
        )
      `)
        .get(
          data.info.latitude, data.info.longitude,
          data.info.latitude, data.info.longitude
        );
      data.history.forEach(elem => {
        db.prepare("INSERT INTO StationHistory VALUES(?, datetime(?), ?)")
          .run(nearest.stationCode, elem.date, elem.state);
      });
    }

    // 最終アクセスの更新
    db.prepare(`
      UPDATE Stations SET getDate = (
        SELECT MAX(date) FROM StationHistory
        WHERE stationCode = ? AND state = 0
      )
      WHERE stationCode = ?
    `)
      .run(res.stationCode, res.stationCode);
    db.prepare(`
      UPDATE Stations SET passDate = (
        SELECT MAX(date) FROM StationHistory
        WHERE stationCode = ? AND state = 1
      )
      WHERE stationCode = ?
    `)
      .run(res.stationCode, res.stationCode);
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
      // 駅名関係なく座標が一番近いものを探す
      const res = db.prepare(`
        SELECT * FROM StationGroups
        WHERE dist(latitude,longitude,?,?) = (
          SELECT MIN(dist(latitude,longitude,?,?)) FROM StationGroups
        )
      `)
        .get(
          data.info.latitude, data.info.longitude,
          data.info.latitude, data.info.longitude
        );
      if(res){
        data.history.forEach(elem => {
          db.prepare("INSERT INTO StationGroupHistory VALUES(?, datetime(?))")
            .run(res.stationGroupCode, elem.date);
        });
      }else{
        console.log("ERROR");
        process.exit(1);
      }
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
