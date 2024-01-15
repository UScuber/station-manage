const fs = require("fs");
const sqlite3 = require("better-sqlite3");
const { SearchAttribute } = require("./searchAttr");

if(process.argv.length <= 3){
  console.error("Argument Error: node convert-geojson.js [geojson-file-name] [json-station-name]");
  process.exit(1);
}
const geojson_file_path = process.argv[2];
if(!fs.existsSync(geojson_file_path)){
  console.error(`Error: ${geojson_file_path} does not exist`);
  process.exit(1);
}
const station_name_file_path = process.argv[3];
if(!fs.existsSync(station_name_file_path)){
  console.error(`Error: ${station_name_file_path} does not exist`);
  process.exit(1);
}


// geojson

const max_same_station_dist = 0.45; // [km]

// [latitude, longitude]
const distance = (a, b) => {
  const R = Math.PI / 180;
  return Math.acos(Math.cos(a.lat*R) * Math.cos(b.lat*R) * Math.cos(b.lng*R - a.lng*R) + Math.sin(a.lat*R) * Math.sin(b.lat*R)) * 6371;
};

let json_data = JSON.parse(fs.readFileSync(geojson_file_path));
json_data = json_data.features;

json_data = json_data.map(elem => {
  delete elem.type;
  elem["coordinates"] = [elem.geometry.coordinates]; // 駅の座標の線分
  delete elem.geometry;

  elem["railwayCode"] = parseInt(elem.properties.N02_001); // 鉄道路線の種類
  elem["companyCode"] = parseInt(elem.properties.N02_002); // 鉄道路線の事業者
  elem["railwayName"] = elem.properties.N02_003; // 鉄道路線の名称
  elem["railwayCompany"] = elem.properties.N02_004; // 鉄道路線を運営する会社
  elem["stationName"] = elem.properties.N02_005; // 駅名
  elem["stationCode"] = parseInt(elem.properties.N02_005c); // 一意の番号(jsonのこの番号はuniqueでない)
  // elem["groupCode"] = elem.properties.N02_005g; // グループコード300m以内の距離にある駅で且つ同じ名称の駅を一つのグループとし、グループの重心に最も近い駅コード

  delete elem.properties;

  return elem;
});


// 同じ駅,路線名,会社のものを一つにする
let station_code_map = {};
json_data.forEach((elem, index) => {
  const codes = `${elem.stationCode}|${elem.stationName}|${elem.railwayCompany}|${elem.groupCode}`;
  if(codes in station_code_map){
    const prev_index = station_code_map[codes];
    json_data[prev_index].coordinates.push(elem.coordinates[0]);
    json_data[index] = null;
  }else{
    station_code_map[codes] = index;
  }
});
json_data = json_data.filter(elem => elem !== null);

// 重心を求める
json_data = json_data.map(elem => {
  const lat = elem.coordinates.reduce((tot, pos) => (
    tot + (pos[0][1] + pos[pos.length-1][1]) * 0.5
  ), 0) / elem.coordinates.length;
  const lng = elem.coordinates.reduce((tot, pos) => (
    tot + (pos[0][0] + pos[pos.length-1][0]) * 0.5
  ), 0) / elem.coordinates.length;

  elem["lat"] = lat;
  elem["lng"] = lng;
  delete elem.coordinates;

  return elem;
});


// 駅の集合を探す
const black_list = ["堀田"];
let station_group_map = {};
let group_codes = new Array(json_data.length).fill(-1);
json_data.forEach((elem, index) => {
  const station_name = elem.stationName;
  if(station_name in station_group_map){
    const station_name_indices = station_group_map[station_name];
    for(let i = 0; i < station_name_indices.length; i++){
      let dist = distance(json_data[index], json_data[station_name_indices[i][0]]);
      if(isNaN(dist)){
        dist = 0;
      }
      if(dist <= max_same_station_dist && !black_list.includes(station_name)){
        station_group_map[station_name].push([index, station_name_indices[i][1]]);
        group_codes[index] = station_name_indices[i][1];
        return;
      }
    }
    station_group_map[station_name].push([index, index]);
    group_codes[index] = index;
  }else{
    station_group_map[station_name] = [[index, index]];
    group_codes[index] = index;
  }
});


json_data = json_data.map((elem, index) => {
  elem["stationGroupCode"] = group_codes[index];
  return elem;
});


// calc center
const station_group_codes = Array.from(new Set(group_codes));
let centers = new Array(json_data.length).fill().map(e => ({ lat:0, lng:0, cnt:0 }));
group_codes.forEach((code, index) => {
  centers[code].lat += json_data[index].lat;
  centers[code].lng += json_data[index].lng;
  centers[code].cnt++;
});
centers = centers.map(pos => {
  if(!pos.cnt) return {};
  return { lat: pos.lat/pos.cnt, lng: pos.lng/pos.cnt };
});



// station name

let station_name_data = JSON.parse(fs.readFileSync(station_name_file_path));
station_name_data = station_name_data.map(elem => ({
  name: elem.original_name,
  name_kana: elem.name_kana,
  lat: elem.lat,
  lng: elem.lng,
  pref: elem.prefecture,
}));

let station_name_maps = {};
station_name_data.forEach(elem => {
  if(!(elem.name in station_name_maps)){
    station_name_maps[elem.name] = [];
  }
  station_name_maps[elem.name].push(elem);
});

(async() => {

let sattr = await SearchAttribute.build();

await Promise.all(station_group_codes.map(async(code) => {
  let elem = json_data[code];
  const name = elem.stationName;
  if(name in station_name_maps){
    const nearest_data = station_name_maps[name].reduce((a, b) => {
      if(distance(a, elem) < distance(b, elem)) return a;
      return b;
    });
    elem["kana"] = nearest_data.name_kana;
    elem["pref"] = nearest_data.pref;
  }else{
    elem["kana"] = await sattr.search_station_name(name);
    elem["pref"] = await sattr.get_pref_code(elem);
  }
}));

if(fs.existsSync("./__temp.txt")) fs.rmSync("./__temp.txt");


if(fs.existsSync("./station.db")) fs.rmSync("./station.db");

const db = sqlite3("./station.db");

const railway_class_cd_data = [
  { code: 11, content: "普通鉄道JR", definition: "" },
  { code: 12, content: "普通鉄道", definition: "" },
  { code: 13, content: "鋼索鉄道", definition: "車両にロープを緊結して山上の巻上機により巻上げて運転するのもであって，一般にケーブルカーと称されるものである。" },
  { code: 14, content: "懸垂式鉄道", definition: "都市交通として利用されるモノレールの構造上の分類であって，車両の斜体部分が軌道桁より垂れ下がっているものである。" },
  { code: 15, content: "跨座式鉄道", definition: "モノレールの分類で，車両の車体部分が軌道桁より上方にあってこれをまたぐ形ものである。" },
  { code: 16, content: "案内軌条式鉄道", definition: "軌道に車両の鉛直荷重を受ける走行路と車両の走行向を誘導する案内軌条を有し，操向装置として案内輪を有するものである。" },
  { code: 17, content: "無軌条鉄道", definition: "レールを設けないで，普通の道路を架空電線に接して走る電車で一般にはトロリーバスと称される。" },
  { code: 21, content: "軌道", definition: "道路に敷設されたレールを進行させるもの。道路交通の補助機関として一般に供されるもので，軌道法の適用を受けるものである。" },
  { code: 22, content: "懸垂式モノレール", definition: "都市交通として利用されるモノレールの構造上の分類であって，車両の斜体部分が軌道桁より垂れ下がっているものである。" },
  { code: 23, content: "跨座式モノレール", definition: "モノレールの分類で，車両の車体部分が軌道桁より上方にあってこれをまたぐ形ものである。" },
  { code: 24, content: "案内軌条式", definition: "軌道に車両の鉛直荷重を受ける走行路と車両の走行向を誘導する案内軌条を有し，操向装置として案内輪を有するものである。" },
  { code: 25, content: "浮上式", definition: "" },
];
const institution_type_cd_data = [
  { code: 1, content: "JRの新幹線" },
  { code: 2, content: "JR在来線" },
  { code: 3, content: "公営鉄道" },
  { code: 4, content: "民営鉄道" },
  { code: 5, content: "第三セクター" },
];
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

console.log("Create tables");

db.transaction(() => {
  // RailwayClassCd
  db.prepare(`
  CREATE TABLE RailwayClassCd(
    code INTEGER,
    content VARCHAR(8),
    definition VARCHAR(64),
    PRIMARY KEY (code)
  )
  `).run();
  railway_class_cd_data.forEach(data => {
    db.prepare("INSERT INTO RailwayClassCd VALUES(?,?,?)").run(data.code, data.content, data.definition);
  });

  // InstitutionTypeCd
  db.prepare(`
  CREATE TABLE InstitutionTypeCd(
    code INTEGER,
    content VARCHAR(8),
    PRIMARY KEY (code)
  )
  `).run();
  institution_type_cd_data.forEach(data => {
    db.prepare("INSERT INTO InstitutionTypeCd VALUES(?,?)").run(data.code, data.content);
  });

  // Prefectures
  db.prepare(`
  CREATE TABLE Prefectures(
    code INTEGER,
    name VARCHAR(4),
    PRIMARY KEY (code)
  )
  `).run();
  prefecture.forEach(data => {
    db.prepare("INSERT INTO Prefectures VALUES(?,?)").run(data.code, data.name);
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
    companyCode INTEGER,
    railwayCode INTEGER,
    stationGroupCode INTEGER,
    railwayName VARCHAR(32) NOT NULL,
    railwayCompany VARCHAR(32) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    getDate DATE,
    passDate DATE,
    PRIMARY KEY (stationCode),
    FOREIGN KEY (companyCode) REFERENCES InstitutionTypeCd(code),
    FOREIGN KEY (railwayCode) REFERENCES RailwayClassCd(code),
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
})();


console.log("Insert data");

// data insert
db.transaction(() => {
  // StationGroups
  station_group_codes.forEach(code => {
    db.prepare("INSERT INTO StationGroups VALUES(?,?,?,?,?,?,NULL)")
      .run(
        code,
        json_data[code].stationName,
        centers[code].lat.toFixed(5),
        centers[code].lng.toFixed(5),
        json_data[code].pref,
        json_data[code].kana,
      );
  });

  // Stations
  json_data.forEach(elem => {
    db.prepare("INSERT INTO Stations VALUES(?,?,?,?,?,?,?,?,NULL,NULL)")
      .run(
        elem.stationCode,
        elem.companyCode,
        elem.railwayCode,
        elem.stationGroupCode,
        elem.railwayName,
        elem.railwayCompany,
        elem.lat.toFixed(5),
        elem.lng.toFixed(5)
      );
  });
})();

db.close();

console.log("Finished");

})();
