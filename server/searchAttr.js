const fs = require("fs");
const { parse } = require("node-html-parser");
const execShPromise = require("exec-sh").promise;

const stations = [
"三宮",
"計算科学センター",
"蓮町（馬場記念公園前）",
"人吉温泉",
"多宝塔",
"山門",
"十国登り口",
"十国峠",
"本町一丁目",
"平和通一丁目",
"萱町六丁目",
"本町六丁目",
"大手町駅前",
"ＪＲ松山駅前",
"本町五丁目",
"本町四丁目",
"本町三丁目",
"遥堪",
"西大寺町",
"東山・おかでんミュージアム",
"ジヤトコ前",
"笹塚",
"押上",
"成田空港",
"空港第2ビル",
"YRP野比",
"羽田空港第1・第2ターミナル",
"ケーブル比叡",
"ケーブル八瀬",
"近鉄四日市",
"あすなろう四日市",
"人吉",
"市立体育館前（県庁通）",
"御岳山",
"滝本",
"JA広島病院前",
"高尾山",
"清滝",
"猫又",
"笹平",
"森石",
"小屋平",
"出平",
"神戸三宮",
"西8丁目",
"西15丁目",
"西4丁目",
"西線11条",
"西線9条旭山公園通",
"西線14条",
"西線16条",
"西線6条",
"山鼻9条",
"山鼻19条",
"南郷7丁目",
"西11丁目",
"南郷13丁目",
"西28丁目",
"南郷18丁目",
"西18丁目",
"北13条東",
"北24条",
"北34条",
"北12条",
"北18条",
"八栗登山口",
"八栗山上",
"鹿島サッカースタジアム",
"鷹巣",
"虹",
"摩耶ケーブル",
"柿ケ島",
"牛ケ原",
"下祗園",
"大山ケーブル",
"阿夫利神社",
"傘松",
"宮脇",
"筑波山頂",
"市民会館",
"大浦海岸通",
"観光通",
"昭和町通",
"神代（鍋島邸前）",
"諫早（雲仙・島原口）",
"吾妻（雲仙市役所前）",
"本諫早（諫早市役所前）",
"各務ケ原",
"モノレール浜松町",
"羽田空港第1ターミナル",
"羽田空港第2ターミナル",
"南阿佐ヶ谷",
"四ツ谷",
"西ヶ原",
"市ヶ谷",
"明治神宮前",
"上野動物園西園",
"上野動物園東園",
"鷹ノ巣",
"茅ヶ崎",
"北茅ヶ崎",
"阿佐ヶ谷",
"千駄ヶ谷",
"保土ヶ谷",
"獨協大学前",
"阿蘇下田城ふれあい温泉",
"ケーブル山上",
"鴬の森",
"公園上",
"公園下",
"中強羅",
"早雲山",
"上強羅",
"山麓",
"山上",
"ケーブル延暦寺",
"ケーブル坂本",
"トヨタモビリティ富山Gスクエア五福前（五福末広町）",
"東京ディズニーシー･ステーション",
"リゾートゲートウェイ･ステーション",
"東京ディズニーランド･ステーション",
"ベイサイド･ステーション",
"越前武生",
"西新湊",
"神宮西",
"伝馬町",
"中村区役所",
"黒部平",
"黒部湖",
"美女平",
"室堂",
"大観峰",
"六甲山上",
"六甲ケーブル下",
"雲泉寺",
"羽田空港第3ターミナル",
"体験坑道",
"青函トンネル記念館",
"ほうらい丘",
"もたて山",
"中町（西町北）",
];

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

exports.search_station_name = async(name) => {
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


let muniData;
exports.get_pref_code = async(pos) => {
  // 緯度・経度からmuniCdを取得
  const getMuniCdFromLatLon = async(pos) => {
    const response = await fetch(
      `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${pos.lat}&lon=${pos.lng}`
    );
    if(!response.ok) return undefined;
    const lonLatToAddress = await response.json();
    return lonLatToAddress.results?.muniCd;
  };
  // muniCdから都道府県コードを取得
  const getPrefectureCodeFromMuniCd = (muniCdInput) => {
    const muniCd = muniCdInput.substring(0, 1) === "0" ? muniCdInput.slice(1) : muniCdInput;
    const muniContents = muniData[muniCd];
    if(!muniContents) return undefined;
    return muniContents.split(",")[0];
  };

  const muniCd = await getMuniCdFromLatLon(pos);
  if(!muniCd) return undefined;
  return getPrefectureCodeFromMuniCd(muniCd);
};

(async() => {
  const res = await fetch("https://maps.gsi.go.jp/js/muni.js");
  // muni.jsの一覧を読み込む
  let text = await res.text();
  text = text.replaceAll("GSI.MUNI_ARRAY", "muniData");
  eval(text);
})();
