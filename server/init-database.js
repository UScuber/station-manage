const fs = require("fs");
const sqlite3 = require("better-sqlite3");
const { parse } = require("csv-parse/sync");
require("dotenv").config();

const station_railway_data_path = "./station-railway-data.json";
if(!fs.existsSync(station_railway_data_path)){
  console.error(`Error: ${station_railway_data_path} does not exist`);
  process.exit(1);
}
const unknown_data_file_path = "./unknown-data.json";
if(!fs.existsSync(unknown_data_file_path)){
  console.error(`Error: ${unknown_data_file_path} does not exist`);
  process.exit(1);
}

const kanaToHira = (str) => {
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
};

const change_width = (s) => (
  s
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace("～", "－")
    .replace("（", "(")
    .replace("）", ")")
);

const station_railway_data = JSON.parse(fs.readFileSync(station_railway_data_path));
const unknown_data = JSON.parse(fs.readFileSync(unknown_data_file_path));

const company_data = parse(fs.readFileSync(process.env.COMPANY_CSV_FILE)).filter((val, idx) => idx)
  .map(row => ({
    companyCode: parseInt(row[0]),
    companyName: change_width(row[2]),
    kana: kanaToHira(row[3]),
    formalName: change_width(row[4]),
  }));

const railway_data =
  station_railway_data.railways.map(data => ({
    railwayCode: data.railwayCode,
    railwayName: change_width(data.railwayName),
    formalName: change_width(data.railwayFormalName),
    railwayKana: kanaToHira(data.railwayKana),
    companyCode: data.companyCode,
    railwayColor: data.railwayColor,
  }))
  .concat(unknown_data.railways.map(data => ({
    railwayCode: data.railwayCode,
    railwayName: change_width(data.railwayName),
    formalName: change_width(data.railwayFormalName),
    railwayKana: kanaToHira(data.railwayKana),
    companyCode: data.companyCode,
    railwayColor: data.railwayColor,
  })));

let stationGroup_cnt = {};
station_railway_data.stations.concat(unknown_data.stations).forEach(data => {
  if(!(data.stationGroupCode in stationGroup_cnt)){
    stationGroup_cnt[data.stationGroupCode] = [];
  }
  stationGroup_cnt[data.stationGroupCode].push(data);
});
const stationGroup_data = Object.keys(stationGroup_cnt).map(stationGroupCode => {
  const list = stationGroup_cnt[stationGroupCode];
  const first_data = list[0];
  const lat = list.reduce((tot, data) => tot + data.lat, 0) / list.length;
  const lng = list.reduce((tot, data) => tot + data.lng, 0) / list.length;
  return {
    stationGroupCode: stationGroupCode,
    stationName: change_width(first_data.stationName),
    prefCode: first_data.prefCode,
    kana: first_data.kana ? kanaToHira(first_data.kana) : null,
    lat: lat,
    lng: lng,
  };
});

const station_data =
  station_railway_data.stations.map(data => ({
    stationCode: data.stationCode,
    stationGroupCode: data.stationGroupCode,
    railwayCode: data.railwayCode,
    lat: data.lat,
    lng: data.lng,
  }))
  .concat(unknown_data.stations.map(data => ({
    stationCode: data.stationCode,
    stationGroupCode: data.stationGroupCode,
    railwayCode: data.railwayCode,
    lat: data.lat,
    lng: data.lng,
  })));


if(fs.existsSync("./station.db")) fs.rmSync("./station.db");

const db = sqlite3("./station.db");

const prefecture = [
  { code: 1, name: "北海道" },
  { code: 2, name: "青森県" }, { code: 3, name: "岩手県" }, { code: 4, name: "宮城県" }, { code: 5, name: "秋田県" }, { code: 6, name: "山形県" }, { code: 7, name: "福島県" },
  { code: 8, name: "茨城県" }, { code: 9, name: "栃木県" }, { code: 10, name: "群馬県" }, { code: 11, name: "埼玉県" }, { code: 12, name: "千葉県" }, { code: 13, name: "東京都" }, { code: 14, name: "神奈川県" },
  { code: 15, name: "新潟県" }, { code: 16, name: "富山県" }, { code: 17, name: "石川県" }, { code: 18, name: "福井県" }, { code: 19, name: "山梨県" }, { code: 20, name: "長野県" },
  { code: 21, name: "岐阜県" }, { code: 22, name: "静岡県" }, { code: 23, name: "愛知県" }, { code: 24, name: "三重県" },
  { code: 25, name: "滋賀県" }, { code: 26, name: "京都府" }, { code: 27, name: "大阪府" }, { code: 28, name: "兵庫県" }, { code: 29, name: "奈良県" }, { code: 30, name: "和歌山県" },
  { code: 31, name: "鳥取県" }, { code: 32, name: "島根県" }, { code: 33, name: "岡山県" }, { code: 34, name: "広島県" }, { code: 35, name: "山口県" },
  { code: 36, name: "徳島県" }, { code: 37, name: "香川県" }, { code: 38, name: "愛媛県" }, { code: 39, name: "高知県" },
  { code: 40, name: "福岡県" },{ code: 41, name: "佐賀県" }, { code: 42, name: "長崎県" }, { code: 43, name: "熊本県" }, { code: 44, name: "大分県" }, { code: 45, name: "宮崎県" }, { code: 46, name: "鹿児島県" },
  { code: 47, name: "沖縄県" },
];

(async() => {

console.log("Insert into DB");

// create table
db.transaction(() => {
  // Companies
  db.prepare(`
  CREATE TABLE Companies(
    companyCode INTEGER,
    companyName VARCHAR(64),
    formalName VARCHAR(64),
    PRIMARY KEY (companyCode)
  )
  `).run();

  // Railways
  db.prepare(`
  CREATE TABLE Railways(
    railwayCode INTEGER,
    railwayName VARCHAR(64) NOT NULL,
    formalName VARCHAR(64) NOT NULL,
    companyCode INTEGER,
    railwayKana VARCHAR(64),
    railwayColor VARCHAR(6),
    PRIMARY KEY (railwayCode)
    FOREIGN KEY (companyCode) REFERENCES Companies(companyCode)
  )
  `).run();

  // Prefectures
  db.prepare(`
  CREATE TABLE Prefectures(
    code INTEGER,
    name VARCHAR(4),
    PRIMARY KEY (code)
  )
  `).run();
  prefecture.forEach(data => {
    db.prepare("INSERT INTO Prefectures VALUES(?,?)").run(
      data.code, data.name
    );
  });

  // StationGroups
  db.prepare(`
  CREATE TABLE StationGroups(
    stationGroupCode INTEGER,
    stationName VARCHAR(80) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    prefCode INTEGER,
    kana VARCHAR(80),
    date DATE,
    PRIMARY KEY (stationGroupCode)
    FOREIGN KEY (prefCode) REFERENCES Prefectures(code)
  )
  `).run();

  // Stations
  db.prepare(`
  CREATE TABLE Stations(
    stationCode INTEGER,
    stationGroupCode INTEGER,
    railwayCode INTEGER,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    getDate DATE,
    passDate DATE,
    PRIMARY KEY (stationCode),
    FOREIGN KEY (railwayCode) REFERENCES Railways(railwayCode),
    FOREIGN KEY (stationGroupCode) REFERENCES StationGroups(stationGroupCode)
  )
  `).run();

  // StationHistory
  db.prepare(`
  CREATE TABLE StationHistory(
    stationCode INTEGER,
    date DATE,
    state INTEGER,
    PRIMARY KEY (stationCode, date, state),
    FOREIGN KEY (stationCode) REFERENCES Stations(stationCode)
  )
  `).run();

  // StationGroupHistory
  db.prepare(`
  CREATE TABLE StationGroupHistory(
    stationGroupCode INTEGER,
    date DATE,
    PRIMARY KEY (stationGroupCode, date),
    FOREIGN KEY (stationGroupCode) REFERENCES StationGroups(stationGroupCode)
  )
  `).run();

  // NextStations
  db.prepare(`
  CREATE TABLE NextStations(
    stationCode INTEGER,
    nextStationCode INTEGER,
    direction INTEGER,
    PRIMARY KEY (stationCode, nextStationCode, direction)
    FOREIGN KEY (stationCode) REFERENCES Stations(stationCode)
    FOREIGN KEY (nextStationCode) REFERENCES Stations(stationCode)
  )
`).run();
})();


// data insert
db.transaction(() => {
  // Companies
  company_data.forEach(data => {
    db.prepare("INSERT INTO Companies VALUES(?,?,?)").run(
      data.companyCode,
      data.companyName,
      data.formalName
    );
  });

  // Railways
  railway_data.forEach(data => {
    db.prepare("INSERT INTO Railways VALUES(?,?,?,?,?,?)").run(
      data.railwayCode,
      data.railwayName,
      data.formalName,
      data.companyCode,
      data.railwayKana,
      data.railwayColor
    );
  });

  // StationGroups
  stationGroup_data.forEach(data => {
    db.prepare("INSERT INTO StationGroups VALUES(?,?,?,?,?,?,NULL)").run(
      data.stationGroupCode,
      data.stationName,
      data.lat.toFixed(6),
      data.lng.toFixed(6),
      data.prefCode,
      data.kana
    );
  });

  // Stations
  station_data.forEach(data => {
    db.prepare("INSERT INTO Stations VALUES(?,?,?,?,?,NULL,NULL)").run(
      data.stationCode,
      data.stationGroupCode,
      data.railwayCode,
      data.lat,
      data.lng
    );
  });

  // NextStations
  station_railway_data.nextStations.forEach(data => {
    const stmt = db.prepare("INSERT INTO NextStations VALUES(?,?,?)");
    data.left.forEach(code => {
      stmt.run(
        data.stationCode,
        code,
        0
      );
    });
    data.right.forEach(code => {
      stmt.run(
        data.stationCode,
        code,
        1
      );
    });
  });

})();

db.close();

console.log("Finished");

})();
