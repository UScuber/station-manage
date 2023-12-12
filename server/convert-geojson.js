const fs = require("fs");
const sqlite3 = require("sqlite3");

if(process.argv.length <= 2){
  console.error("Argument Error: node convert-geojson.js [geojson-file-name]");
  process.exit(1);
}
const file_path = process.argv[2];
if(!fs.existsSync(file_path)){
  console.error(`Error: ${file_path} does not exist`);
  process.exit(1);
}


const max_same_station_dist = 0.37; // [km]

// [latitude, longitude]
const distance = (p1, p2) => {
  const R = Math.PI / 180;
  return Math.acos(Math.cos(p1[0]*R) * Math.cos(p2[0]*R) * Math.cos(p2[1]*R - p1[1]*R) + Math.sin(p1[0]*R) * Math.sin(p2[0]*R)) * 6371;
};

let json_data = JSON.parse(fs.readFileSync(file_path).toString());
json_data = json_data.features;

json_data = json_data.map((elem) => {
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
json_data = json_data.filter((elem) => elem !== null);

// 重心を求める
json_data = json_data.map((elem) => {
  let latitude = 0, longitude = 0;
  elem.coordinates.forEach((pos) => {
    // [経度, 緯度]
    latitude += (pos[0][1] + pos[pos.length-1][1]) * 0.5;
    longitude += (pos[0][0] + pos[pos.length-1][0]) * 0.5;
  });
  latitude /= elem.coordinates.length;
  longitude /= elem.coordinates.length;

  elem["center"] = [latitude, longitude];
  delete elem.coordinates;

  return elem;
});


// 駅の集合を探す
const black_list = ["堀田"];
let station_group_map = {};
let group_codes = [];
for(let i = 0; i < json_data.length; i++) group_codes.push(-1);
json_data.forEach((elem, index) => {
  const station_name = elem.stationName;
  if(station_name in station_group_map){
    const station_name_indices = station_group_map[station_name];
    for(let i = 0; i < station_name_indices.length; i++){
      let dist = distance(json_data[index].center, json_data[station_name_indices[i][0]].center);
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
let centers = new Array(json_data.length);
for(let i = 0; i < json_data.length; i++) centers[i] = { lat:0, lng:0, cnt:0 };
group_codes.forEach((code, index) => {
  centers[code].lat += json_data[index].center[0];
  centers[code].lng += json_data[index].center[1];
  centers[code].cnt++;
});
centers = centers.map((pos) => {
  if(!pos.cnt) return {};
  return { lat: pos.lat/pos.cnt, lng: pos.lng/pos.cnt };
});


if(fs.existsSync("./station.db")) fs.rmSync("./station.db");

const db = new sqlite3.Database("./station.db");

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

console.log("Create tables");

db.serialize(() => {
  // RailwayClassCd
  db.run(`
    CREATE TABLE RailwayClassCd(
      code INTEGER,
      content VARCHAR(8),
      definition VARCHAR(64),
      PRIMARY KEY (code)
    )
  `);
  railway_class_cd_data.forEach((data) => {
    db.run("INSERT INTO RailwayClassCd VALUES(?,?,?)", data.code, data.content, data.definition);
  });

  // InstitutionTypeCd
  db.run(`
    CREATE TABLE InstitutionTypeCd(
      code INTEGER,
      content VARCHAR(8),
      PRIMARY KEY (code)
    )
  `);
  institution_type_cd_data.forEach((data) => {
    db.run("INSERT INTO InstitutionTypeCd VALUES(?,?)", data.code, data.content);
  });

  // StationNames
  db.run(`
    CREATE TABLE StationNames(
      stationGroupCode INTEGER,
      stationName VARCHAR(32) NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      PRIMARY KEY (stationGroupCode)
    )
  `);

  // StationCodes
  db.run(`
    CREATE TABLE StationCodes(
      stationCode INTEGER,
      companyCode INTEGER,
      railwayCode INTEGER,
      stationGroupCode INTEGER,
      railwayName VARCHAR(32) NOT NULL,
      railwayCompany VARCHAR(32) NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      PRIMARY KEY (stationCode),
      FOREIGN KEY (companyCode) REFERENCES InstitutionTypeCd(code),
      FOREIGN KEY (railwayCode) REFERENCES RailwayClassCd(code),
      FOREIGN KEY (stationGroupCode) REFERENCES StationNames(stationGroupCode)
    )
  `);

  // StationHistory
  db.run(`
    CREATE TABLE StationHistory(
      stationCode INTEGER,
      date DATE,
      state INTEGER,
      PRIMARY KEY (stationCode, date, state),
      FOREIGN KEY (stationCode) REFERENCES StationCodes(stationCode)
    )
  `);

  // StationState
  db.run(`
    CREATE TABLE StationState(
      stationCode INTEGER,
      getOnDate DATE,
      getOffDate DATE,
      passDate DATE,
      PRIMARY KEY (stationCode),
      FOREIGN KEY (stationCode) REFERENCES StationCodes(stationCode)
    )
  `);

  // StationGroupHistory
  db.run(`
    CREATE TABLE StationGroupHistory(
      stationGroupCode INTEGER,
      date DATE,
      isIntoStation BOOLEAN,
      PRIMARY KEY (stationGroupCode, date, isIntoStation),
      FOREIGN KEY (stationGroupCode) REFERENCES StationNames(stationGroupCode)
    )
  `);

  // StationGroupState
  db.run(`
    CREATE TABLE StationGroupState(
      stationGroupCode INTEGER,
      enterDate DATE,
      getOutDate DATE,
      PRIMARY KEY (stationGroupCode),
      FOREIGN KEY (stationGroupCode) REFERENCES StationNames(stationGroupCode)
    )
  `);


  console.log("Insert data");
  // data insert
  // StationNames
  db.parallelize(() => {
    station_group_codes.forEach((code) => {
      db.run(
        "INSERT INTO StationNames VALUES(?,?,?,?)",
        code,
        json_data[code].stationName,
        centers[code].lat,
        centers[code].lng
      );
    });
  });

  db.parallelize(() => {
    // StationCodes
    json_data.forEach((elem) => {
      db.run(
        "INSERT INTO StationCodes VALUES(?,?,?,?,?,?,?,?)",
        elem.stationCode,
        elem.companyCode,
        elem.railwayCode,
        elem.stationGroupCode,
        elem.railwayName,
        elem.railwayCompany,
        elem.center[0],
        elem.center[1]
      );
    });
  
    // StationState, StationGroupState
    json_data.forEach((elem) => {
      db.run("INSERT INTO StationState VALUES(?,NULL,NULL,NULL)", elem.stationCode);
    });

    // StationGroupState
    Array.from(new Set(group_codes)).forEach((index) => {
      db.run("INSERT INTO StationGroupState VALUES(?,NULL,NULL)", json_data[index].stationGroupCode);
    });
  });
});

db.close();

console.log("Finished");
