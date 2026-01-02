// データを取り入れる
const fs = require("fs");
require("dotenv").config();

const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.API_BASEURL;

if (!API_KEY || !BASE_URL) {
  console.error("API_KEY or BASE_URL are not exist");
  process.exit(1);
}

if (!fs.existsSync("data")) {
  fs.mkdirSync("data");
}

const max_limit = 100;

const fetch_data = async (dir, query) => {
  const url =
    `${BASE_URL}/${dir}?key=${API_KEY}` +
    Object.keys(query)
      .map((key) => `&${key}=${query[key]}`)
      .join("");
  const res = await fetch(url);
  const json = await res.json();
  return json.ResultSet;
};

const get_contents_num = async (dir) => {
  const json = await fetch_data(dir, { limit: 1 });
  return json.max;
};

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

// 駅情報の取得(group)
(async () => {
  if (fs.existsSync("./data/station.json")) return;

  const station_num = await get_contents_num("station");

  const get_row_data = async (offset) => {
    const json = await fetch_data("station", {
      offset: offset + 1,
      gcs: "wgs84",
    });
    return []
      .concat(json.Point)
      .map((data) => ({
        stationGroupCode: +data.Station.code,
        stationName: data.Station.Name,
        prefCode: +data.Prefecture.code,
        kana: data.Station.Yomi,
        lat: +data.GeoPoint.lati_d,
        lng: +data.GeoPoint.longi_d,
        type: data.Station.Type,
      }))
      .filter((data) => data.type === "train");
  };

  let station_list = [];
  for (let i = 0; i < station_num; i += max_limit) {
    const rows = await get_row_data(i);
    station_list = station_list.concat(rows);
    await sleep(100);
  }

  const get_detail_data = async (code) => {
    const json = await fetch_data("station/info", {
      code: code,
      type: "operationLine",
    });
    const company_list = [].concat(json.Information.Corporation);
    if (!json.Information.Line) return [];
    return [].concat(json.Information.Line).map((data) => ({
      railwayCode: +data.code,
      railwayName: data.Name,
      companyName: company_list[+data.corporationIndex - 1].Name,
      companyCode: +company_list[+data.corporationIndex - 1].code,
    }));
  };

  for (let i = 0; i < station_list.length; i++) {
    station_list[i]["railway"] = await get_detail_data(
      station_list[i].stationGroupCode
    );
    await sleep(100);
  }
  station_list = station_list.filter((data) => data.railway.length);

  fs.writeFileSync(
    "./data/station.json",
    JSON.stringify(station_list, null, "  ")
  );
  console.log("station data fetch OK");
})();

// 路線名の取得
(async () => {
  if (fs.existsSync("./data/railway.json")) return;

  const railway_num = await get_contents_num("operationLine");

  const rgb10to16 = (col) =>
    [0, 1, 2]
      .map((idx) => ("0" + (+col.substr(idx * 3, 3)).toString(16)).slice(-2))
      .join("");

  const find_color_from_rail = async (railwayName) => {
    const json = await fetch_data("rail", { name: railwayName });
    if (!json.Line?.Name) return undefined;
    if (json.Line.Name === railwayName) return json.Line.Color;
    return undefined;
  };

  const get_row_data = async (offset) => {
    const json = await fetch_data("operationLine", { offset: offset + 1 });
    const company_list = [].concat(json.Corporation);
    return Array.from(
      await Promise.all(
        [].concat(json.Line).map(async (data) => ({
          railwayCode: +data.code,
          railwayName: data.Name,
          kana: data.Yomi,
          companyName: company_list[+data.corporationIndex - 1].Name,
          companyCode: +company_list[+data.corporationIndex - 1].code,
          railwayColor: rgb10to16(
            (await find_color_from_rail(data.Name)) ?? data.Color
          ),
        }))
      )
    );
  };

  let railway_list = [];
  for (let i = 0; i < railway_num; i += max_limit) {
    const rows = await get_row_data(i);
    railway_list = railway_list.concat(rows);
    await sleep(200);
  }

  fs.writeFileSync(
    "./data/railway.json",
    JSON.stringify(railway_list, null, " ")
  );
  console.log("railway fetch OK");
})();

// 会社コードの取得
(async () => {
  if (fs.existsSync("./data/company.json")) return;

  const company_num = await get_contents_num("corporation");

  const get_row_data = async (offset) => {
    const json = await fetch_data("corporation", { offset: offset + 1 });
    return [].concat(json.Corporation).map((data) => ({
      companyCode: +data.code,
      company: data.Name,
    }));
  };

  let company_list = [];
  for (let i = 0; i < company_num; i += max_limit) {
    const rows = await get_row_data(i);
    company_list = company_list.concat(rows);
    await sleep(200);
  }

  fs.writeFileSync(
    "./data/company.json",
    JSON.stringify(company_list, null, " ")
  );
  console.log("company fetch OK");
})();
