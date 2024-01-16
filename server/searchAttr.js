const fs = require("fs");
const { parse } = require("node-html-parser");
const execShPromise = require("exec-sh").promise;


const kanaToHira = (str) => {
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
};

const is_almost_same_str = (s, t) => {
  if(s.length !== t.length) return false;
  let diff = 0;
  for(let i = 0; i < s.length; i++){
    if(s[i] !== t[i]) diff++;
  }
  return diff <= 1;
};

const is_all_hira = (str) => {
  return /^[\u3041-\u3096A-Za-z0-9（）・･ー]+$/.test(str);
};


class SearchAttribute {
  constructor(){
    this.muniData = undefined;
  }
  static build = async() => {
    const obj = new SearchAttribute();
    let muniData;
    const res = await fetch("https://maps.gsi.go.jp/js/muni.js");
    // muni.jsの一覧を読み込む
    let text = await res.text();
    text = text.replaceAll("GSI.MUNI_ARRAY", "muniData");
    eval(text);
    obj.muniData = muniData;
    return obj;
  }

  search_station_name = async(name) => {
    // wikipediaから探す
    const results = Array.from(await Promise.all(["駅", "停留場"].map(async(suffix) => {
      const result = await fetch("https://ja.wikipedia.org/wiki/" + name + suffix);
      const root = parse(await result.text());
      const res = root.querySelector("#mw-content-text > div.mw-content-ltr.mw-parser-output > table.infobox.bordered > tbody > tr:nth-child(3) > td > span");
      const title = root.querySelector("#firstHeading > span").textContent;
      if(is_almost_same_str(title, name + suffix)){
        if(!res?.childNodes){
          return null;
        }
        return res.childNodes[0]._rawText.trim();
      }
      return false;
    }))).filter(res => res);
  
    if(results.length) return results[0];
  
    // ルビ推測
    let result;
    fs.writeFileSync("__temp.txt", name + "駅");
    try{
      result = await execShPromise("mecab -Oyomi -N3 < __temp.txt", true);
    }catch(err){
      console.error(err);
      if(fs.existsSync("./__temp.txt")) fs.rmSync("./__temp.txt");
      process.exit(1);
    }
    result = result.stdout.trim().split("\n");
    if(result[0] === result[1] && result[0] === result[2]){
      result = result[0];
      result = result.substring(0, result.length-2);
      result = kanaToHira(result);
      if(is_all_hira(result)) return result;
    }
    return null;
  };

  // muniCdから都道府県コードを取得
  getPrefectureCodeFromMuniCd = (muniCdInput) => {
    const muniCd = muniCdInput.substring(0, 1) === "0" ? muniCdInput.slice(1) : muniCdInput;
    const muniContents = this.muniData[muniCd];
    if(!muniContents) return undefined;
    return muniContents.split(",")[0];
  };

  // 緯度・経度からmuniCdを取得
  getMuniCdFromLatLon = async(pos) => {
    const response = await fetch(
      `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${pos.lat}&lon=${pos.lng}`
    );
    if(!response.ok) return undefined;
    const lonLatToAddress = await response.json();
    return lonLatToAddress.results?.muniCd;
  };

  get_pref_code = async(pos) => {
    const muniCd = await this.getMuniCdFromLatLon(pos);
    if(!muniCd) return undefined;
    return this.getPrefectureCodeFromMuniCd(muniCd);
  };
};

exports.SearchAttribute = SearchAttribute;
