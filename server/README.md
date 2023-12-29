# server

## 初期設定

```
npm install
node convert-geojson.js [geojsonへのファイルパス]
```

- 駅のデータ: https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v3_1.html
  - utf8/N02-22_Station.geojsonへのパスを入れてください

## サーバーの起動

```
node server.js
```



# 隣駅を計算するプログラム

## railroad.txtの内容

```
駅の総数
路線の総数(路線名と路線会社をセットとして考える)
駅1の座標(lat,lng)
駅1の路線id
駅1の路線名 駅1の路線会社 駅1の駅名
...
駅n

pathの個数
<path 1のid> <path 1の線の数>
path 1のlist(lat1,lng1,lat2,lng2,...)
...
<path nのid> <path nの線の数>
path nのlist(lat1,lng1,lat2,lng2,...)
```
