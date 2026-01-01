class SearchAttribute {
  constructor() {
    this.muniData = undefined;
  }
  static build = async () => {
    const obj = new SearchAttribute();
    let muniData;
    const res = await fetch("https://maps.gsi.go.jp/js/muni.js");
    // muni.jsの一覧を読み込む
    let text = await res.text();
    text = text.replaceAll("GSI.MUNI_ARRAY", "muniData");
    eval(text);
    obj.muniData = muniData;
    return obj;
  };

  // muniCdから都道府県コードを取得
  getPrefectureCodeFromMuniCd = (muniCdInput) => {
    if (!this.muniData) {
      console.error("muniData is not initialized");
      return undefined;
    }
    const muniCd =
      muniCdInput.substring(0, 1) === "0" ? muniCdInput.slice(1) : muniCdInput;
    const muniContents = this.muniData[muniCd];
    if (!muniContents) return undefined;
    return muniContents.split(",")[0];
  };

  // 緯度・経度からmuniCdを取得
  getMuniCdFromLatLon = async (pos) => {
    const response = await fetch(
      `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${pos.lat}&lon=${pos.lng}`
    );
    if (!response.ok) return undefined;
    const lonLatToAddress = await response.json();
    return lonLatToAddress.results?.muniCd;
  };

  get_pref_code = async (pos) => {
    const muniCd = await this.getMuniCdFromLatLon(pos);
    if (!muniCd) return undefined;
    return this.getPrefectureCodeFromMuniCd(muniCd);
  };
}

exports.SearchAttribute = SearchAttribute;
