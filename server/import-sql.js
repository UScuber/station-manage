// convert-geojson.js実行後のSQLに入れる

const fs = require("fs");
const sqlite3 = require("sqlite3");

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

const db = new sqlite3.Database("./station.db");

const input_json = JSON.parse(fs.readFileSync(file_path));

// [latitude, longitude]
const distance = (p1, p2) => {
  const R = Math.PI / 180;
  return Math.acos(Math.cos(p1[0]*R) * Math.cos(p2[0]*R) * Math.cos(p2[1]*R - p1[1]*R) + Math.sin(p1[0]*R) * Math.sin(p2[0]*R)) * 6371;
};

input_json.station_history.forEach(data => {
});

input_json.station_group_history.forEach(data => {

});
