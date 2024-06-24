const fs = require("fs");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const { convert_date } = require("./components/lib");
const Station = require("./controllers/station");
const User = require("./controllers/user");
const History = require("./controllers/history");



const app = express();

const reg = (() => {
  const split_url = process.env.REACT_URL.split(".");
  const regExpEscape = (str) => str.replace(/[-\\^$*+?.()|\[\]{}]/g, "\\$&");
  return new RegExp(regExpEscape(split_url[0])+(split_url.length > 1 ? "(?:\\-[0-9a-z]{12})?\\." : "") + regExpEscape(split_url.slice(1).join(".")));
})();

app.use(cors({
  origin: (origin, callback) => {
    if(reg.test(origin)){
      callback(null, true);
    }else{
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "300mb" }));
app.use(express.json({ extended: true, limit: "300mb" }));

// エラー時の処理
app.use((err, req, res, next) => {
  console.error(`\x1b[31m[${err.name}] ${err.message}\x1b[39m`, err.stack.substr(err.stack.indexOf("\n")));
  const log_data = `[${err.name}] ${err.message} (${req.method} ${req.originalUrl}) ${err.stack.substr(err.stack.indexOf("\n"))}\n`;
  write_log_data(log_data);
  res.status(err?.status ?? 500).send(err.message);
});

// manage access log
const log_file = __dirname + "/info.log";
const write_log_data = (log_data) => fs.appendFileSync(log_file, log_data);

const accessLog = (req, res, next) => {
  const log_data = `[${convert_date(new Date())}] ${req.method} ${req.originalUrl}\n`;
  write_log_data(log_data);
  next();
};


app.get("/", accessLog, (req, res) => {
  res.end("OK");
});

app.get("/api", accessLog, (req, res) => {
  res.end("OK");
});


// 駅情報取得
app.get("/api/station/:stationCode", accessLog, Station.station);

// 駅グループの情報取得
app.get("/api/stationGroup/:stationGroupCode", accessLog, Station.groupStations);


// 駅グループに属する駅の駅情報を取得
app.get("/api/stationsByGroupCode/:stationGroupCode", accessLog, Station.stationGroup);

// 路線情報取得
app.get("/api/railway/:railwayCode", accessLog, Station.railway);

// 路線情報全取得
app.get("/api/railway", accessLog, Station.railways);

// 路線に属する駅の駅情報を取得
app.get("/api/railwayStations/:railwayCode", accessLog, Station.railwayStations);

// 会社情報取得
app.get("/api/company/:companyCode", accessLog, Station.company);

// 会社情報全取得
app.get("/api/company", accessLog, Station.companies);

// 会社に属する路線の路線情報を取得
app.get("/api/companyRailways/:companyCode", accessLog, Station.companyRailways);

// 会社に属する路線の駅情報を全取得
app.get("/api/companyStations/:companyCode", accessLog, Station.companyStations);

// 県に属する路線の路線情報を取得
app.get("/api/prefRailways/:prefCode", accessLog, Station.prefRailways);

// 県に属する路線の駅情報を全取得
app.get("/api/prefStations/:prefCode", accessLog, Station.prefStations);

// 駅グループを名前で検索、区間指定
app.get("/api/searchStationGroupList", accessLog, Station.stationGroupList);

// 駅グループを名前で検索した際の件数
app.get("/api/searchStationGroupCount", accessLog, Station.stationGroupCount);

// 座標から近い駅/駅グループを複数取得
app.get("/api/searchNearestStationGroup", accessLog, Station.searchKNearestStationGroups);

// 都道府県名を取得
app.get("/api/pref/:prefCode", accessLog, Station.prefecture);

// 都道府県名を全取得
app.get("/api/pref", accessLog, Station.prefectures);

// 路線の線路のpathを取得
app.get("/api/railpaths/:railwayCode", accessLog, Station.railPath);

// 会社に属する全路線の線路のpathを取得
app.get("/api/pathslist/:companyCode", accessLog, Station.railPathList);





// 新規登録
app.post("/api/signup", accessLog, User.signup);

// ログイン
app.post("/api/login", accessLog, User.login);

// check
app.get("/api/status", accessLog, User.status);

// logout
app.get("/api/logout", accessLog, User.logout);





// 駅の最新のアクセス日時を取得
app.get("/api/latestStationHistory/:stationCode", accessLog, History.latestStationHistory);

// 路線に属する駅の最新のアクセス日時を取得
app.get("/api/latestRailwayStationHistory/:railwayCode", accessLog, History.latestStationHistoryList);

// 駅グループの最新のアクセス日時を取得
app.get("/api/latestStationGroupHistory/:stationGroupCode", accessLog, History.latestStationGroupHistory);

// 全体の乗降/通過の履歴を区間取得
app.get("/api/stationHistory", accessLog, History.stationHistoryList);

// 全体の乗降/通過の履歴の個数を取得
app.get("/api/stationHistoryCount", accessLog, History.stationHistoryCount);

// 駅情報を付与した履歴を取得
app.get("/api/stationHistoryAndInfo", accessLog, History.stationHistoryDetail);

// 駅の履歴を取得
app.get("/api/stationHistory/:stationCode", accessLog, History.stationHistory);

// 駅グループ全体の履歴を取得(各駅の行動も含める)
app.get("/api/stationGroupHistory/:stationGroupCode", accessLog, History.stationGroupHistory);

// 駅グループを名前で検索、区間指定した時のグループの最新の履歴
app.get("/api/searchStationGroupListHistory", accessLog, History.latestStationGroupHistoryList);

// 路線の駅の個数と乗降/通過した駅の個数を取得
app.get("/api/railwayProgress/:railwayCode", accessLog, History.railwayProgress);

// 会社の各路線の駅の個数と乗降/通過した駅の個数を取得
app.get("/api/railwayProgressList/:companyCode", accessLog, History.railwayProgressList);

// 指定された都道府県に駅がが存在する路線の駅の個数と乗降/通過した駅の個数を取得
app.get("/api/prefRailwayProgressList/:prefCode", accessLog, History.railwayProgressListByPref);

// 全会社の各路線の駅の個数と乗降/通過した駅の個数のリストを取得
app.get("/api/railwayProgressList", accessLog, History.railwayProgressListAll);

// 会社の駅の個数と乗降/通過した駅の個数を取得
app.get("/api/companyProgress/:companyCode", accessLog, History.companyProgress);

// 全会社の駅の個数と乗降/通過した駅の個数のリストを取得
app.get("/api/companyProgress", accessLog, History.companyProgressList);

// 都道府県の駅の個数と乗降/通過した駅の個数を取得(駅グループを1つとはしない)
app.get("/api/prefProgress/:prefCode", accessLog, History.prefProgress);

// 全国の駅の個数と乗降/通過した駅の個数を取得(駅グループを1つとはしない)
app.get("/api/prefProgress", accessLog, History.prefProgressList);

// 乗降/通過の情報を追加
app.get("/api/postStationDate", accessLog, History.postStationDate);

// 立ち寄りの情報を追加
app.get("/api/postStationGroupDate", accessLog, History.postStationGroupDate);

// 乗降/通過の履歴を削除
app.get("/api/deleteStationDate", accessLog, History.deleteStationDate);

// 立ち寄りの履歴を削除
app.get("/api/deleteStationGroupState", accessLog, History.deleteStationGroupDate);

// 履歴のエクスポート
app.post("/api/exportHistory", accessLog, History.exportHistory);

// 履歴のインポート
app.post("/api/importHistory", accessLog, History.importHistory);


module.exports = app;
