# Station Manage

## 概要
日本の鉄道駅の訪問記録(乗りつぶし)を管理・可視化するためのウェブアプリケーションです。
訪れた駅や通過した駅を記録し、路線や都道府県ごとの制覇率を進捗として確認したり、地図上で履歴を振り返ることができます。

## 技術スタック

### フロントエンド
- **Core**: React (Vite)
- **UI Framework**: Material UI (MUI)
- **Map & Visualization**: Mapbox GL JS, React Map GL
- **HTTP Client**: Axios

### バックエンド
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: SQLite (better-sqlite3)
 

### 環境変数

.envファイルを設定する

```
VITE_API_BASEURL="api_baseurl(http://localhost:3001)"
MAPBOX_ACCESS_TOKEN="mapbox_access_token"
VITE_MAPBOX_STYLE_URL="mapbox_style_url"
```
