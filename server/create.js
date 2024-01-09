const fs = require("fs");
const execShPromise = require("exec-sh").promise;
const sqlite3 = require("better-sqlite3");

if(process.argv.length <= 3){
  console.error("Argument Error: node create.js [station-geojson-file-name] [railroad-geojson-file-name]");
  process.exit(1);
}
const station_file_path = process.argv[2];
const railroad_file_path = process.argv[3];
const output_file = "railroad.txt";
if(!fs.existsSync(railroad_file_path)){
  console.error(`Error: ${railroad_file_path} does not exist`);
  process.exit(1);
}
if(!fs.existsSync(station_file_path)){
  console.error(`Error: ${station_file_path} does not exist`);
  process.exit(1);
}

const calc_station_codes = () => {
  let json_data = JSON.parse(fs.readFileSync(station_file_path));
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

  let counter = 0;
  let railway_id = {};
  json_data = json_data.map(elem => {
    const s = `${elem.railwayName}|${elem.railwayCompany}`;
    if(!(s in railway_id)){
      railway_id[s] = counter;
      counter++;
    }
    elem["railwayId"] = railway_id[s];
    return elem;
  });
  return [json_data, railway_id];
};
const [station_data, railway_id] = calc_station_codes();


console.log("Create input data");

let buffer = "";

buffer += station_data.length + "\n";
buffer += Object.keys(railway_id).length + "\n";

// write station info
for(let i = 0; i < station_data.length; i++){
  const geometry = station_data[i].coordinates;
  buffer += geometry.length + "\n";
  for(let j = 0; j < geometry.length; j++){
    buffer += geometry[j].length + "\n";
    buffer += geometry[j].map(pos => pos[1].toFixed(5) + " " + pos[0].toFixed(5)).join(" ");
    buffer += "\n";
  }
  buffer += station_data[i].stationCode + " " + station_data[i].railwayId + "\n";
  buffer += station_data[i].railwayName + " " + station_data[i].railwayCompany + " " + station_data[i].stationName + "\n";
}

// write railway info
let json_data = JSON.parse(fs.readFileSync(railroad_file_path));
json_data = json_data.features;

buffer += json_data.length + "\n"; // pathの個数
for(let i = 0; i < json_data.length; i++){
  const s = `${json_data[i].properties.N02_003}|${json_data[i].properties.N02_004}`;
  const id = railway_id[s];
  // if(s.indexOf("中央線") !== -1) console.log(s, id);
  const geometry = json_data[i].geometry.coordinates;
  buffer += id + " " + geometry.length + "\n";
  for(let j = 0; j < geometry.length; j++){
    buffer += geometry[j][1].toFixed(5) + " " + geometry[j][0].toFixed(5) + " ";
  }
  buffer += "\n";
}

fs.writeFileSync(output_file, buffer);


console.log("Compile & Run");

const run_and_get_json = async() => {
  try{
    await execShPromise("g++ calc.cpp -o calc -O2");
  }catch(err){
    console.error(err);
    process.exit(1);
  }
  let result;
  try{
    result = await execShPromise("./calc < railroad.txt", true);
  }catch(err){
    console.error(err);
    process.exit(1);
  }
  return JSON.parse(result.stdout);
};

const write_DB = async() => {
  const next_station_data = await run_and_get_json();

  console.log("Write DB");
  const db = sqlite3("./station.db");

  // create table
  db.prepare("DROP TABLE IF EXISTS NextStations").run();
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

  // data insert
  db.transaction(() => {
    const stmt = db.prepare("INSERT INTO NextStations VALUES(?,?,?)");
    next_station_data.forEach(data => {
      data.left.forEach(next => {
        stmt.run(data.stationCode, next.stationCode, 0);
      });
      data.right.forEach(next => {
        stmt.run(data.stationCode, next.stationCode, 1);
      });
    });
  })();

  db.close();

  console.log("Finished");
};
write_DB();
