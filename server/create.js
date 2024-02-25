const fs = require("fs");
const execShPromise = require("exec-sh").promise;
require("dotenv").config();

class NextStationGen {
  constructor(){
    this.station_file_path =  process.env.N02_STATION_FILE;
    this.railroad_file_path = process.env.N02_RAILROAD_FILE;
    this.output_file = "railroad.txt";

    if(!fs.existsSync(this.station_file_path)){
      console.error(`Error: ${this.station_file_path} does not exist`);
      process.exit(1);
    }
    if(!fs.existsSync(this.railroad_file_path)){
      console.error(`Error: ${this.railroad_file_path} does not exist`);
      process.exit(1);
    }
  }

  calc_station_codes = () => {
    let json_data = JSON.parse(fs.readFileSync(this.station_file_path));
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

  create_data = () => {
    const [station_data, railway_id] = this.calc_station_codes();

    let buffer = "";

    buffer += station_data.length + "\n";
    buffer += Object.keys(railway_id).length + "\n";

    // write station info
    for(let i = 0; i < station_data.length; i++){
      const geometry = station_data[i].coordinates;
      buffer += geometry.length + "\n";
      buffer += geometry.map(geo => (
        geo.length + "\n" + geo.map(pos => pos[1].toFixed(5) + " " + pos[0].toFixed(5)).join(" ")
      )).join("\n");
      buffer += "\n";
      buffer += station_data[i].stationCode + " " + station_data[i].railwayId + "\n";
      buffer += station_data[i].railwayName + " " + station_data[i].railwayCompany + " " + station_data[i].stationName + "\n";
    }

    // write railway info
    let json_data = JSON.parse(fs.readFileSync(this.railroad_file_path));
    json_data = json_data.features;

    buffer += json_data.length + "\n"; // pathの個数
    for(let i = 0; i < json_data.length; i++){
      const s = `${json_data[i].properties.N02_003}|${json_data[i].properties.N02_004}`;
      const geometry = json_data[i].geometry.coordinates;
      buffer += railway_id[s] + " " + geometry.length + "\n";
      buffer += geometry.map(geo => geo[1].toFixed(5) + " " + geo[0].toFixed(5)).join(" ");
      buffer += "\n";
    }
    buffer += "\n";

    fs.writeFileSync(this.output_file, buffer);
  };
  compile_calc_cpp = async() => {
    try{
      await execShPromise("g++ calc.cpp -o calc -O2", true);
    }catch(err){
      console.error(err);
      process.exit(1);
    }
  };

  run_calc_cpp = async() => {
    let result;
    try{
      result = await execShPromise("./calc < railroad.txt", true);
    }catch(err){
      console.error(err);
      process.exit(1);
    }
    return JSON.parse(result.stdout);
  };

  get_next_station_data = async() => {
    console.log("Create input data & Compile");

    await (async() => {
      setTimeout(this.create_data, 0);
      this.compile_calc_cpp();
    })();

    return await this.run_calc_cpp();
  };
};

exports.NextStationGen = NextStationGen;
