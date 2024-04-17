# server

## 初期設定

- .envファイルを設定する
```
REACT_URL="" // frontendのURL(なしでも可)
API_KEY="<駅すぱあとのAPIKEY>"
API_BASEURL="https://api.ekispert.jp/v1/json" // 駅すぱあとのAPIのURL

// 駅データ.jpからダウンロードしたcsvファイルのpath
LINE_CSV_FILE="data/line20xxxxxxfree.csv"
COMPANY_CSV_FILE="data/company20xxxxxx.csv"
STATION_CSV_FILE="data/station20xxxxxxfree.csv"
JOIN_CSV_FILE="data/join20xxxxxx.csv"

N02_STATION_FILE="data/..._Station.geojson" // 国土交通省の駅データのpath
N02_RAILROAD_FILE="data/..._RailroadSection.geojson" // 国土交通省の線路データのpath
```

- セットアップ
```
npm install
node fetch-data.js
node collect-data.js
// unknown-data.jsonにあるnull値を記入する
node init-database.js
node import-sql.js <履歴が入ったjsonのpath> // 必要があれば
```

### データの参照先

- 駅すぱあと: https://docs.ekispert.com/v1/le/index.html
- 駅データ.jp: https://ekidata.jp/
- 国道交通省のデータ: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v3_1.html

## サーバーの起動

```
node server.js
```


## プログラムの概要

### convert-geojson.js

geojsonのデータからDBの基本的な情報を入力する

### export-sql.js, import-sql.js

jsonデータから乗降や通過などのデータをDBからimport,exportする

#### railroad.txtの内容

```
駅の総数
路線の総数(路線名と路線会社をセットとして考える)
<駅1のホームの線路数>
<駅1の線路1の線の数>
<駅1の線路1のpathのlist(lat1 lng 1 lat2 lng2 ...)>
...
<駅1の線路nの線の数>
<駅1の線路nのpathのlist(lat1 lng 1 lat2 lng2 ...)>
<駅1の駅コード> <駅1の路線id>
<駅1の路線名> <駅1の路線会社> <駅1の駅名>
...
駅n

pathの個数
<path 1のid> <path 1の線の数>
path 1のlist(lat1 lng1 lat2 lng2 ...)
...
<path nのid> <path nの線の数>
path nのlist(lat1 lng1 lat2 lng2...)
```
