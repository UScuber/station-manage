// 読み仮名がない駅を手動で入力する

const fs = require("fs");
const sqlite3 = require("better-sqlite3");

if(process.argv.length <= 3){
  console.error("Argument Error: node setKanaManual.js [import or export] [json-file-name]");
  process.exit(1);
}
const mode = process.argv[2];
const file_path = process.argv[3];
if(!fs.existsSync("./station.db")){
  console.error(`Error: ./station.db does not exist`);
  process.exit(1);
}

const db = sqlite3("./station.db");
db.pragma("journal_mode = WAL");


// 読み仮名を付けたデータを読み込む
if(mode === "import"){
  const json_data = JSON.parse(fs.readFileSync(file_path));
  json_data.forEach(elem => {
    if(elem.kana && elem.stationGroupCode && elem.stationName){
      db.prepare(`
        UPDATE StationGroups SET kana = ?
        WHERE stationGroupCode = ?
      `).run(elem.kana, elem.stationGroupCode);
      console.log("write", elem.stationName);
    }
  });
}
// 読み仮名がない駅名を出力
else if(mode === "export"){
  const res = db.prepare(`
    SELECT stationGroupCode, stationName, kana FROM StationGroups
    WHERE kana IS NULL
  `).all();
  fs.writeFileSync(file_path, JSON.stringify(res, null, "  "));
}

db.close();
