const fs = require("fs");
const { parse } = require("csv-parse/sync");
const execShPromise = require("exec-sh").promise;
const { SearchAttribute } = require("./searchAttr");
const { NextStationGen } = require("./create");
require("dotenv").config();


const max_same_station_dist = 0.45; // [km]
const distance = (a, b) => {
  const R = Math.PI / 180;
  return Math.acos(Math.cos(a.lat*R) * Math.cos(b.lat*R) * Math.cos(b.lng*R - a.lng*R) + Math.sin(a.lat*R) * Math.sin(b.lat*R)) * 6371;
};

const normalize_name = (s) => (
  s
    .replace("（", "(")
    .replace("）", ")")
    .replace("〈", "(")
    .replace("〉", ")")
    .replace(" ", "")  
    .replace("ケ", "ヶ")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace("～", "－")
    .replace(/[・･].+/, (s) => "(" + s.substr(1) + ")")
);

const encode_str = (s) => btoa(String.fromCharCode.apply(null, new TextEncoder().encode(s)));

let railway_data = {};
parse(fs.readFileSync(process.env.LINE_CSV_FILE))
  .filter((_, idx) => idx)
  .filter(row => +row[11] !== 2) // 廃止を除く
  .forEach(row => {
    railway_data[+row[0]] = {
      companyCode: +row[1],
      railwayName: normalize_name(row[2]),
      prevRailwayName: row[2],
      railwayKana: row[3],
      railwayFormalName: normalize_name(row[4]),
      prevRailwayFormalName: row[4],
    };
  });

let company_data = {};
parse(fs.readFileSync(process.env.COMPANY_CSV_FILE))
  .filter((_, idx) => idx)
  .filter(row => +row[8] !== 2) // 廃止を除く
  .forEach(row => {
    company_data[+row[0]] = {
      companyName: normalize_name(row[2]),
      prevCompanyName: row[2],
    };
  });

let stationGroupCode_data = {};
const arrange_stationGroupCode = (stationGroupCode, stationName) => {
  if(!(stationGroupCode in stationGroupCode_data)){
    stationGroupCode_data[stationGroupCode] = {};
  }
  if(!(stationName in stationGroupCode_data[stationGroupCode])){
    stationGroupCode_data[stationGroupCode][stationName] = Object.keys(stationGroupCode_data[stationGroupCode]).length;
  }
  return parseInt(stationGroupCode + "" + stationGroupCode_data[stationGroupCode][stationName]);
};

const station_data = parse(fs.readFileSync(process.env.STATION_CSV_FILE))
  .filter((_, idx) => idx)
  .filter(row => +row[13] !== 2) // 廃止を除く
  .map(row => ({
    stationCode: +row[0],
    stationGroupCode: arrange_stationGroupCode(row[1], row[2]),
    stationName: normalize_name(row[2]),
    prevStationName: row[2],
    railwayCode: +row[5],
    railwayName: railway_data[row[5]].railwayName,
    prevRailwayName: railway_data[row[5]].prevRailwayName,
    railwayFormalName: railway_data[row[5]].railwayFormalName,
    prevRailwayFormalName: railway_data[row[5]].prevRailwayFormalName,
    railwayKana: railway_data[row[5]].railwayKana,
    companyCode: railway_data[row[5]].companyCode,
    companyName: company_data[railway_data[row[5]].companyCode].companyName,
    prevCompanyName: company_data[railway_data[row[5]].companyCode].prevCompanyName,
    prefCode: +row[6],
    lng: +row[9],
    lat: +row[10],
  }));

let join_data = {};
station_data
  .forEach(data => join_data[data.stationCode] = { left: [], right: [] });
parse(fs.readFileSync(process.env.JOIN_CSV_FILE)).filter((_, idx) => idx)
  .forEach(row => {
    const left = +row[1], right = +row[2];
    if(!(left in join_data) || !(right in join_data)) return;
    join_data[left].right.push(right);
    join_data[right].left.push(left);
  });

let filtered_station_data = station_data
  .filter(data => join_data[data.stationCode].left.length + join_data[data.stationCode].right.length);

Object.keys(join_data).forEach(stationCode => {
  join_data[stationCode].left = Array.from(new Set(join_data[stationCode].left));
  join_data[stationCode].right = Array.from(new Set(join_data[stationCode].right));
});


const main_station_data = JSON.parse(fs.readFileSync("./data/station.json"))
  .flatMap(data => data.railway.map(rail => ({
    stationCode: data.stationGroupCode + ("00" + rail.railwayCode).slice(-3),
    stationGroupCode: data.stationGroupCode,
    stationName: normalize_name(data.stationName),
    railwayCode: rail.railwayCode,
    railwayName: normalize_name(rail.railwayName),
    companyCode: rail.companyCode,
    companyName: normalize_name(rail.companyName),
    kana: data.kana,
    prefCode: data.prefCode,
    lat: data.lat,
    lng: data.lng,
  })));


let route_data = JSON.parse(fs.readFileSync(process.env.N02_STATION_FILE)).features
  .map(elem => {
    delete elem.type;
    elem["coordinates"] = [elem.geometry.coordinates]; // 駅の座標の線分
    delete elem.geometry;

    elem["railwayCode"] = +elem.properties.N02_001; // 鉄道路線の種類
    elem["companyCode"] = +elem.properties.N02_002; // 鉄道路線の事業者
    elem["railwayName"] = elem.properties.N02_003; // 鉄道路線の名称
    elem["railwayCompany"] = elem.properties.N02_004; // 鉄道路線を運営する会社
    elem["stationName"] = elem.properties.N02_005; // 駅名
    elem["stationCode"] = +elem.properties.N02_005c; // 一意の番号(jsonのこの番号はuniqueでない)

    delete elem.properties;

    elem.stationName = normalize_name(elem.stationName);

    return elem;
  });
// 同じ駅,路線名,会社のものを一つにする
let station_code_map = {};
route_data.forEach((elem, index) => {
  const codes = `${elem.stationCode}|${elem.stationName}|${elem.railwayCompany}|${elem.groupCode}`;
  if(codes in station_code_map){
    const prev_index = station_code_map[codes];
    route_data[prev_index].coordinates.push(elem.coordinates[0]);
    route_data[index] = null;
  }else{
    station_code_map[codes] = index;
  }
});
route_data = route_data.filter(elem => elem !== null)
  // 重心を求める
  .map(elem => {
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
let group_codes = new Array(route_data.length).fill(-1);
route_data.forEach((elem, index) => {
  const station_name = elem.stationName;
  if(station_name in station_group_map){
    const station_name_indices = station_group_map[station_name];
    for(let i = 0; i < station_name_indices.length; i++){
      let dist = distance(route_data[index], route_data[station_name_indices[i][0]]);
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
route_data = route_data.map((elem, index) => {
  elem["stationGroupCode"] = group_codes[index];
  return elem;
});


let buffer = "";

buffer += main_station_data.length + "\n";
buffer += main_station_data.map(data => (
  `${data.stationCode} ${data.stationGroupCode} ${encode_str(data.stationName)} `
  + `${data.railwayCode} ${encode_str(data.railwayName)} `
  + `${data.companyCode} ${encode_str(data.companyName)} `
  + `${(+data.lat).toFixed(6)} ${(+data.lng).toFixed(6)}`
)).join("\n") + "\n";

buffer += "0\n";

buffer += filtered_station_data.length + "\n";
buffer += filtered_station_data.map(data => (
  `${data.stationCode} ${data.stationGroupCode} ${encode_str(data.stationName)} `
  + `${data.railwayCode} ${encode_str(data.railwayFormalName)} `
  + `${data.companyCode} ${encode_str(data.companyName)} `
  + `${(+data.lat).toFixed(6)} ${(+data.lng).toFixed(6)}`
)).join("\n") + "\n";

buffer += filtered_station_data.length + "\n";
buffer += filtered_station_data.map(data => (
  data.stationCode + " " +
  ["left", "right"]
    .map(dir => join_data[data.stationCode][dir].length + " " + join_data[data.stationCode][dir].join(" "))
    .join(" ")
)).join("\n") + "\n";


buffer += route_data.length + "\n";
let railwayName_cnt = {}, company_cnt = {};
buffer += route_data.map(data => {
  if(!(data.railwayName in railwayName_cnt)){
    railwayName_cnt[data.railwayName] = Object.keys(railwayName_cnt).length;
  }
  if(!(data.railwayCompany in company_cnt)){
    company_cnt[data.railwayCompany] = Object.keys(company_cnt).length;
  }
  return `${data.stationCode} ${data.stationGroupCode} ${encode_str(data.stationName)} `
        + `${railwayName_cnt[data.railwayName]} ${encode_str(data.railwayName)} `
        + `${company_cnt[data.railwayCompany]} ${encode_str(data.railwayCompany)} `
        + `${(+data.lat).toFixed(6)} ${(+data.lng).toFixed(6)}`;
}).join("\n") + "\n";

(async() => {

const next_station_data = await new NextStationGen().get_next_station_data();
buffer += next_station_data.length + "\n";
buffer += next_station_data.map(data => (
  data.stationCode + " " +
  ["left", "right"]
    .map(dir => data[dir].length + " " + data[dir].map(v => v.stationCode).join(" "))
    .join(" ")
)).join("\n") + "\n";


fs.writeFileSync("input.txt", buffer);


console.log("Compile & Run");

try{
  await execShPromise("g++ datalink.cpp", true);
}catch(err){
  console.error(err);
  process.exit(1);
}
let result;
try{
  result = await execShPromise("./a.out < input.txt", true);
}catch(err){
  console.error(err);
  process.exit(1);
}
const result_json = JSON.parse(result.stdout);

console.log("Check");

// [code, return value]
const find_station_pair = (code) => {
  for(let i = 0; i < result_json.stationPairs.length; i++){
    if(result_json.stationPairs[i][0] == code){
      return result_json.stationPairs[i][1];
    }
  }
  return undefined;
};
const find_railway_pair = (code) => {
  for(let i = 0; i < result_json.railwayPairs.length; i++){
    if(result_json.railwayPairs[i][0] == code){
      return result_json.railwayPairs[i][1];
    }
  }
  return undefined;
};

const railway_detail_data = JSON.parse(fs.readFileSync("./data/railway.json"));
const find_railway_data = (code) => {
  for(let i = 0; i < railway_detail_data.length; i++){
    if(railway_detail_data[i].railwayCode == code){
      return railway_detail_data[i];
    }
  }
  return undefined;
};
const station_detail_data = JSON.parse(fs.readFileSync("./data/station.json"));
const find_station_data = (code) => {
  for(let i = 0; i < station_detail_data.length; i++){
    if(station_detail_data[i].stationGroupCode == code){
      return station_detail_data[i];
    }
  }
  return undefined;
}

// 新幹線の情報を追加
filtered_station_data = filtered_station_data.concat(result_json.shinkansen.stations.map(data => {
  const sub_stationCode = find_station_pair(data.stationCode);
  if(!sub_stationCode){
    console.error("shinkansen is not linked");
    process.exit(1);
  }
  const info = find_station_data((+sub_stationCode).toString().substring(0, 5));
  join_data[data.stationCode] = {
    left: data.left,
    right: data.right,
  };
  return {
    stationCode: data.stationCode,
    stationGroupCode: data.stationGroupCode,
    prevStationName: data.stationName,
    railwayCode: data.railwayCode,
    prevRailwayName: data.railwayName,
    prevRailwayFormalName: data.railwayName,
    railwayKana: railway_data[data.railwayCode].railwayKana,
    companyCode: railway_data[data.railwayCode].companyCode,
    prevCompanyName: company_data[railway_data[data.railwayCode].companyCode].prevCompanyName,
    prefCode: info.prefCode,
    lat: info.lat,
    lng: info.lng,
  };
}));


const sattr = new SearchAttribute();

let name_unlinked_stations = [];
const stations_db = Array.from(await Promise.all(filtered_station_data.map(async(data) => {
  const sub_stationCode = find_station_pair(data.stationCode);
  let kana = "";
  if(!sub_stationCode){
    const kana_cand = await sattr.search_station_name(data.stationName, true);
    if(kana_cand === null){
      name_unlinked_stations.push(data);
      return undefined;
    }
    kana = kana_cand;
  }
  if(!kana){
    const info = find_station_data((+sub_stationCode).toString().substring(0, 5));
    kana = info.kana;
  }
  return {
    stationCode: data.stationCode,
    stationGroupCode: data.stationGroupCode,
    stationName: data.prevStationName,
    railwayCode: data.railwayCode,
    railwayName: data.prevRailwayName,
    railwayFormalName: data.prevRailwayFormalName,
    railwayKana: data.railwayKana,
    companyCode: data.companyCode,
    companyName: data.prevCompanyName,
    prefCode: data.prefCode,
    lat: data.lat,
    lng: data.lng,
    kana: kana,
  };
}))).filter(data => data);


railway_data = {};
filtered_station_data.forEach(data => {
  railway_data[data.railwayCode] = data;
});
const railways_db = Object.keys(railway_data).map(railwayCode => {
  const sub_railwayCode = find_railway_pair(railwayCode);
  if(!sub_railwayCode){
    return undefined;
  }
  const detail = find_railway_data(sub_railwayCode);
  return {
    railwayCode: +railwayCode,
    railwayName: railway_data[railwayCode].prevRailwayName,
    railwayFormalName: railway_data[railwayCode].prevRailwayFormalName,
    railwayKana: railway_data[railwayCode].railwayKana,
    companyCode: railway_data[railwayCode].companyCode,
    companyName: railway_data[railwayCode].prevCompanyName,
    railwayColor: detail.railwayColor,
  };
}).filter(data => data);

// next stations
const next_station_db = filtered_station_data.map(data => ({
  stationCode: data.stationCode,
  left: join_data[data.stationCode].left,
  right: join_data[data.stationCode].right,
}));

fs.writeFileSync("station-railway-data.json", JSON.stringify(
  {
    stations: stations_db,
    railways: railways_db,
    nextStations: next_station_db,
  },
  null, "  "
));

// unknown data
// 読み仮名がわからなかったもの
const unknown_station_data = name_unlinked_stations
  .map(data => ({
    stationCode: data.stationCode,
    stationGroupCode: data.stationGroupCode,
    stationName: data.prevStationName,
    railwayCode: data.railwayCode,
    railwayName: data.prevRailwayName,
    railwayFormalName: data.prevRailwayFormalName,
    railwayKana: data.railwayKana,
    companyCode: data.companyCode,
    companyName: data.prevCompanyName,
    prefCode: data.prefCode,
    lat: data.lat,
    lng: data.lng,
    kana: null,
  }));

// 路線の色がわからなかったもの
const unknown_railway_data = Object.keys(railway_data)
  .filter(railwayCode => !find_railway_pair(railwayCode))
  .map(railwayCode => ({
    railwayCode: +railwayCode,
    railwayName: railway_data[railwayCode].prevRailwayName,
    railwayFormalName: railway_data[railwayCode].prevRailwayFormalName,
    railwayKana: railway_data[railwayCode].railwayKana,
    companyCode: railway_data[railwayCode].companyCode,
    companyName: railway_data[railwayCode].prevCompanyName,
    railwayColor: null,
  }));

const unknown_data_file_path = "unknown-data.json";
if(fs.existsSync(unknown_data_file_path)){
  console.log(`${unknown_data_file_path} already exists`);
}else{
  fs.writeFileSync(unknown_data_file_path, JSON.stringify({ stations: unknown_station_data, railways: unknown_railway_data }, null, "  "));
  console.log(`Please fill out null values (file: ${unknown_data_file_path})`);
}

})();
