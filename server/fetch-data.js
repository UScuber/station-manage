// データを取り入れる
const fs = require("fs");
require("dotenv").config();

const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.API_BASEURL;

if(!API_KEY || !BASE_URL){
  console.error("API_KEY or BASE_URL are not exist");
  process.exit(1);
}

if(!fs.existsSync("data")){
  fs.mkdirSync("data");
}

const max_limit = 100;

const fetch_data = async(dir, query) => {
  const url = `${BASE_URL}/${dir}?key=${API_KEY}`
    + Object.keys(query).map(key => `&${key}=${query[key]}`).join("");
  const res = await fetch(url);
  const json = await res.json();
  return json.ResultSet;
};

const get_contents_num = async(dir) => {
  const json = await fetch_data(dir, { limit: 1 });
  return json.max;
};

const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));


// 駅情報の取得(group)
(async() => {
  if(fs.existsSync("./data/stationGroup.json")) return;

  const station_num = await get_contents_num("station");

  const get_row_data = async(offset) => {
    const json = await fetch_data("station", { offset: offset+1, gcs: "wgs84" });
    return [].concat(json.Point).map(data => ({
      stationGroupCode: data.Station.code,
      stationName: data.Station.Name,
      prefCode: data.Prefecture.code,
      kana: data.Station.Yomi,
      latitude: data.GeoPoint.lati_d,
      longitude: data.GeoPoint.longi_d,
    }));
  };

  let stationGroup_list = [];
  for(let i = 0; i < station_num; i += max_limit){
    const rows = await get_row_data(i);
    stationGroup_list = stationGroup_list.concat(rows);
    await sleep(200);
  }

  fs.writeFileSync("./data/stationGroup.json", JSON.stringify(stationGroup_list, null, " "));
  console.log("station group fetch OK");
})();


// 路線名の取得
(async() => {
  if(fs.existsSync("./data/railway.json")) return;

  const railway_num = await get_contents_num("operationLine");

  const rgb10to16 = (col) => {
    [0,1,2].map(idx => ("0" + parseInt(col.substr(idx*3,3), 10).toString(16)).slice(-2)).join("");
  };

  const get_row_data = async(offset) => {
    const json = await fetch_data("operationLine", { offset: offset+1 });
    const company_list = [].concat(json.Corporation);
    return [].concat(json.Line).map(data => ({
      raiwayCode: data.code,
      railwayName: data.Name,
      kana: data.Yomi,
      company: company_list[parseInt(data.corporationIndex, 10) - 1].Name,
      companyCode: company_list[parseInt(data.corporationIndex, 10) - 1].code,
      railwayColor: rgb10to16(data.Color),
    }));
  };

  let railway_list = [];
  for(let i = 0; i < railway_num; i += max_limit){
    const rows = await get_row_data(i);
    railway_list = railway_list.concat(rows);
    await sleep(200);
  }

  fs.writeFileSync("./data/railway.json", JSON.stringify(railway_list, null, " "));
  console.log("railway fetch OK");
})();


// 会社コードの取得
(async() => {
  if(fs.existsSync("./data/company.json")) return;

  const company_num = await get_contents_num("corporation");

  const get_row_data = async(offset) => {
    const json = await fetch_data("corporation", { offset: offset+1 });
    return [].concat(json.Corporation).map(data => ({
      companyCode: data.code,
      company: data.Name,
    }));
  };

  let company_list = [];
  for(let i = 0; i < company_num; i += max_limit){
    const rows = await get_row_data(i);
    company_list = company_list.concat(rows);
    await sleep(200);
  }

  fs.writeFileSync("./data/company.json", JSON.stringify(company_list, null, " "));
  console.log("company fetch OK");
})();
