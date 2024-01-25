# server

## 初期設定

```
npm install
node convert-geojson.js [Station.geojsonへのpath] [駅名が入ったjsonへのpath]
node setKanaManual.js [更新したい読み仮名のデータのjsonへのpath] # 必要があれば
node create.js [Station.geojsonへのpath] [RailroadSection.geojsonへのpath]
```

- 駅のデータ: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v3_1.html
  - utf8/N02-22_Station.geojsonへのパスを入れてください

## サーバーの起動

```
node server.js
```


## プログラムの概要

### convert-geojson.js

geojsonのデータからDBの基本的な情報を入力する

### export-sql.js, import-sql.js

jsonデータから乗降や通過などのデータをDBからimport,exportする

### create.js

隣駅をcalc.cppで計算してその結果をDBに入力する

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
