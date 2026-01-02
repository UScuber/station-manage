// 駅の読み仮名の対応付けと路線の色の対応付けをする
#include <iostream>
#include <vector>
#include <string>
#include <cmath>
#include <algorithm>
#include <tuple>
#include <set>
#include <map>
#include <queue>
#include <cassert>
#include <cstdint>

constexpr double PI = 3.14159265358979323846;

template<class T, class U>
bool chmax(T &a, const U &b){ return a < b ? (a = b, 1) : 0; }
template<class T, class U>
bool chmin(T &a, const U &b){ return a > b ? (a = b, 1) : 0; }

double get_double(){
  int a; char c; int b;
  std::cin >> a >> c >> b;
  return a + b * 1e-6;
}

struct Pos {
  double lat,lng;

  Pos() : lat(0), lng(0){}
  Pos(const double a, const double b) : lat(a), lng(b){}
  double dist_km(const Pos &a) const{
    static constexpr double R = PI / 180;
    return acos(cos(lat*R) * cos(a.lat*R) * cos(a.lng*R - lng*R) + sin(lat*R) * sin(a.lat*R)) * 6371;
  }
  double dist(const Pos &a) const{
    return sqrt((lat-a.lat)*(lat-a.lat) + (lng-a.lng)*(lng-a.lng));
  }
  inline constexpr bool operator<(const Pos &a) const{
    if(lat != a.lat) return lat < a.lat;
    return lng < a.lng;
  }
  inline constexpr bool operator==(const Pos &a) const{
    return lat == a.lat && lng == a.lng;
  }
  inline Pos operator-(const Pos &a) const{
    return Pos(lat-a.lat, lng-a.lng);
  }
  inline constexpr double dot(const Pos &a) const{
    return lat*a.lat + lng*a.lng;
  }
  inline constexpr double cross(const Pos &a) const{
    return lat*a.lng - lng*a.lat;
  }
  inline constexpr double abs() const{
    return sqrt(lat*lat + lng*lng);
  }
  inline constexpr double arg_cos(const Pos &a) const{
    return (dot(a) / (abs() * a.abs()));
  }
  inline constexpr double arg() const{
    return atan2(lng, lat);
  }
};

Pos get_coordinate(){
  const double lat = get_double();
  const double lng = get_double();
  return Pos(lat, lng);
}


struct Company {
  int code;
  std::string name;

  Company(const int code, const std::string &name) : code(code), name(name){}
};

struct Railway {
  int code;
  std::string name;
  const Company *company;

  Railway(const int code, const std::string &name, const Company *company) : code(code), name(name), company(company){}
};

struct StationGroup {
  int code;
  std::string name;
  int stationCnt;

  StationGroup(const int code, const std::string &name) : code(code), name(name), stationCnt(0){}
};

struct Station {
  int code;
  StationGroup *info;
  const Railway *rail;
  Pos pos;
  std::vector<const Station*> left, right;

  Station(const int code, StationGroup *info, const Railway *rail, const Pos &pos) :
    code(code), info(info), rail(rail), pos(pos){}

  void add_left(const Station *st){ left.emplace_back(st); }
  void add_right(const Station *st){ right.emplace_back(st); }

  // 左の隣駅をたどって目的の駅まで移動する距離
  int calc_left_station_dist(const Station *target){
    if(!dist_left.empty()){
      if(dist_left.count(target)) return dist_left[target];
      return 100000;
    }
    std::queue<const Station*> que;
    que.push(this);
    dist_left[this] = 0;
    while(!que.empty()){
      const auto current = que.front();
      que.pop();
      for(const auto next : current->left){
        if(dist_left.count(next)) continue;
        dist_left[next] = dist_left[current] + 1;
        que.push(next);
      }
    }
    if(dist_left.count(target)) return dist_left[target];
    return 100000;
  }

  int calc_right_station_dist(const Station *target){
    if(!dist_right.empty()){
      if(dist_right.count(target)) return dist_right[target];
      return 100000;
    }
    std::queue<const Station*> que;
    que.push(this);
    dist_right[this] = 0;
    while(!que.empty()){
      const auto current = que.front();
      que.pop();
      for(const auto next : current->right){
        if(dist_right.count(next)) continue;
        dist_right[next] = dist_right[current] + 1;
        que.push(next);
      }
    }
    if(dist_right.count(target)) return dist_right[target];
    return 100000;
  }

private:
  std::map<const Station*, int> dist_left, dist_right;
};

struct StationDatabase {
  std::vector<Station> stations;
  std::vector<StationGroup> stationGroups;
  std::vector<Railway> railways;
  std::vector<Company> companies;

  void build(){
    stations_data.clear();
    railway_stations_mut.clear();
    railway_stations.clear();

    for(auto &station : stations){
      stations_data[station.code] = &station;
      railway_stations_mut[station.rail->code].emplace_back(&station);
    }
    for(const auto &station : stations){
      railway_stations[station.rail->code].emplace_back(&station);
    }
  }

  Station *get_station(const int stationCode){
    assert(stations_data.count(stationCode));
    return stations_data[stationCode];
  }
  std::vector<const Station*> &get_railway_stations(const int railwayCode){
    assert(railway_stations.count(railwayCode));
    return railway_stations[railwayCode];
  }
  std::vector<Station*> &get_railway_stations_mut(const int railwayCode){
    assert(railway_stations_mut.count(railwayCode));
    return railway_stations_mut[railwayCode];
  }

private:
  std::map<int, Station*> stations_data;
  std::map<int, std::vector<const Station*>> railway_stations;
  std::map<int, std::vector<Station*>> railway_stations_mut;
};

StationDatabase eki_data;
StationDatabase ekispert_data;
StationDatabase kokudo_route_data;

int str_dist(const std::string &s, const std::string &t){
  std::vector<std::vector<int>> dp((int)s.size()+1, std::vector<int>((int)t.size()+1));
  for(int i = 0; i <= s.size(); i++) dp[i][0] = i;
  for(int i = 0; i <= t.size(); i++) dp[0][i] = i;
  for(int i = 1; i <= s.size(); i++){
    for(int j = 1; j <= t.size(); j++){
      dp[i][j] = std::min(std::min(dp[i-1][j], dp[i][j-1]) + 1, dp[i-1][j-1] + (s[i-1] == t[j-1] ? 0 : 1));
    }
  }
  return dp[s.size()][t.size()];
}

std::string base64decode(const std::string &s){
  std::string res;
  uint8_t phase = 0;
  char b;
  uint8_t tmp;
  for(char ch : s){
    uint8_t tmp = 0;
    if(ch >= 'A' && ch <= 'Z'){
      tmp = ch - 'A';
    }else if(ch >= 'a' && ch <= 'z'){
      tmp = ch - 'a' + 26;
    }else if(ch >= '0' && ch <= '9'){
      tmp = ch - '0' + 52;
    }else if(ch == '+'){
      tmp = 62;
    }else if(ch == '/'){
      tmp = 63;
    }else if(ch == '='){
      if(phase == 1) res += b;
      break;
    }else{
      res = "";
      phase = 0;
      break;
    }
    switch(phase){
      case 0: {
        b = tmp << 2;
      }
      break;
      case 1: {
        b += tmp >> 4 & 0b11;
        res += b;
        b = (tmp & 0b1111) << 4;
      }
      break;
      case 2: {
        b += tmp >> 2 & 0b1111;
        res += b;
        b = (tmp & 0b11) << 6;
      }
      break;
      case 3: {
        b += tmp & 0b111111;
        res += b;
      }
      break;
    }
    phase = (phase + 1) % 4;
  }
  return res;
}

void get_station_data(StationDatabase &data){
  int station_num;
  std::cin >> station_num;
  std::map<int, const Company*> company_cnt;
  std::map<std::pair<int, int>, const Railway*> railway_cnt;
  std::map<int, StationGroup*> group_cnt;
  std::map<int, Station*> station_cnt;
  data.railways.reserve(station_num + 100);
  data.companies.reserve(station_num);
  data.stationGroups.reserve(station_num + 200);
  data.stations.reserve(station_num + 200);
  for(int i = 0; i < station_num; i++){
    int stationCode, stationGroupCode; std::string stationName;
    int railwayCode; std::string railwayName;
    int companyCode; std::string companyName;
    std::cin >> stationCode >> stationGroupCode >> stationName >> railwayCode >> railwayName >> companyCode >> companyName;
    stationName = base64decode(stationName);
    railwayName = base64decode(railwayName);
    companyName = base64decode(companyName);
    const Pos pos = get_coordinate();
    if(!company_cnt.count(companyCode)){
      data.companies.emplace_back(companyCode, companyName);
      company_cnt[companyCode] = &data.companies.back();
    }
    if(!railway_cnt.count({ companyCode, railwayCode })){
      data.railways.emplace_back(railwayCode, railwayName, company_cnt[companyCode]);
      railway_cnt[{ companyCode, railwayCode }] = &data.railways.back();
    }
    if(!group_cnt.count(stationGroupCode)){
      data.stationGroups.emplace_back(stationGroupCode, stationName);
      group_cnt[stationGroupCode] = &data.stationGroups.back();
    }
    group_cnt[stationGroupCode]->stationCnt++;
    data.stations.emplace_back(stationCode, group_cnt[stationGroupCode], railway_cnt[{ companyCode, railwayCode }], pos);
    station_cnt[stationCode] = &data.stations.back();
  }

  int info_num;
  std::cin >> info_num;
  for(int i = 0; i < info_num; i++){
    int stationCode, left_num;
    std::cin >> stationCode >> left_num;
    for(int j = 0; j < left_num; j++){
      int code;
      std::cin >> code;
      station_cnt[stationCode]->add_left(station_cnt[code]);
    }
    int right_num;
    std::cin >> right_num;
    for(int j = 0; j < right_num; j++){
      int code;
      std::cin >> code;
      station_cnt[stationCode]->add_right(station_cnt[code]);
    }
  }
};
void input(){
  get_station_data(ekispert_data);
  get_station_data(eki_data);
  get_station_data(kokudo_route_data);
}

bool almost_same(const std::string &s, const std::string &t){
  if(s == t) return true;
  if(s.find('(') != std::string::npos && s.substr(0, s.find('(')) == t) return true;
  if(t.find('(') != std::string::npos && t.substr(0, t.find('(')) == s) return true;
  return false;
}

// 読みを推測する、路線名までの一致判定は行わない
void link_stations_name(std::vector<std::pair<int, int>> &main_sub_station_pairs, std::vector<const Station*> &unknown_stations){
  std::map<std::string, std::vector<const Station*>> name_map;
  for(const auto &station : ekispert_data.stations){
    name_map[station.info->name].emplace_back(&station);
  }
  for(const auto &station : eki_data.stations){
    if(name_map.count(station.info->name)){
      const Station *min_st = &ekispert_data.stations.front();
      double min_dist = 1e9;
      for(const auto st : name_map[station.info->name]){
        if(st->rail->name.find("新幹線") != std::string::npos) continue;
        const double d = station.pos.dist_km(st->pos) + str_dist(station.rail->name, st->rail->name) * 0.1;
        if(min_dist > d){
          min_dist = d;
          min_st = st;
        }
      }
      main_sub_station_pairs.emplace_back(station.code, min_st->code);
      continue;
    }
    const Station *min_st = &ekispert_data.stations.front();
    double min_dist = 1e9;
    for(const auto &sta : ekispert_data.stations){
      if(sta.rail->name.find("新幹線") != std::string::npos) continue;
      const double d = station.pos.dist_km(sta.pos) - almost_same(station.info->name, sta.info->name) - almost_same(station.rail->name, sta.rail->name);
      if(min_dist > d){
        min_dist = d;
        min_st = &sta;
      }
    }
    if(min_dist >= 0.03 && station.info->name != min_st->info->name){
      unknown_stations.emplace_back(&station);
    }else{
      main_sub_station_pairs.emplace_back(station.code, min_st->code);
    }
  }
}

// 2津のデータの同じ路線の対応をとる
void link_railways_color(
  std::vector<std::pair<int, int>> &main_sub_railway_pairs,
  std::vector<const Railway*> &unknown_railways,
  const std::vector<std::pair<int, int>> &main_sub_station_pairs
){
  auto calc_avg_dist = [](
    std::vector<const Station*> &stas1,
    std::vector<const Station*> &stas2,
    bool(*comp)(const Station*, const Station*)
  ) -> double {
    assert(stas1.size() == stas2.size());
    std::sort(stas1.begin(), stas1.end(), comp);
    std::sort(stas2.begin(), stas2.end(), comp);
    double avg_dist = 0;
    for(int i = 0; i < (int)stas1.size(); i++){
      if(almost_same(stas1[i]->info->name, stas2[i]->info->name)){
        continue;
      }
      avg_dist += stas1[i]->pos.dist_km(stas2[i]->pos);
    }
    avg_dist /= stas1.size();
    return avg_dist;
  };
  auto calc_nearest_dist = [](
    const std::vector<const Station*> &stas1,
    const std::vector<const Station*> &stas2
  ) -> double {
    std::set<int> used;
    double avg_dist = 0;
    for(const auto station : stas1){
      const Station *min_st = stas2[0];
      for(const auto sta : stas2){
        if(used.count(sta->code)) continue;
        if(station->pos.dist_km(min_st->pos) > station->pos.dist_km(sta->pos) || almost_same(station->info->name, sta->info->name)) min_st = sta;
      }
      if(!almost_same(station->info->name, min_st->info->name)){
        avg_dist += station->pos.dist_km(min_st->pos);
      }
      used.insert(min_st->code);
    }
    avg_dist /= stas1.size();
    return avg_dist;
  };

  for(const auto &main_railway : eki_data.railways){
     auto &main_railway_stations = eki_data.get_railway_stations(main_railway.code);
    const auto main_first = main_railway_stations[0];
    bool ok = false;

    for(const auto &sub_railway : ekispert_data.railways){
      auto &sub_railway_stations = ekispert_data.get_railway_stations(sub_railway.code);
      const auto sub_first = sub_railway_stations[0];
      // 名前の一致判定
      if(main_first->rail->name == sub_first->rail->name && main_first->rail->company->name == sub_first->rail->company->name){
        main_sub_railway_pairs.emplace_back(main_railway.code, sub_railway.code);
        ok = true;
        break;
      }
      // 1路線だけの駅での一致判定
      bool found = false;
      for(const auto station : main_railway_stations){
        if(station->info->stationCnt != 1) continue;
        for(const auto sta : sub_railway_stations){
          if(sta->info->stationCnt != 1) continue;
          if(station->info->name == sta->info->name){
            found = true;
            break;
          }
        }
        if(!found) break;
      }
      if(found){
        ok = true;
        main_sub_railway_pairs.emplace_back(main_railway.code, sub_railway.code);
        break;
      }
      // 路線の全駅での一致判定
      if(main_railway_stations.size() != sub_railway_stations.size()) continue;
      double min_avg_dist = 1e9;
      chmin(min_avg_dist, calc_avg_dist(main_railway_stations, sub_railway_stations, [](const auto a, const auto b){ return a->pos < b->pos; }));
      chmin(min_avg_dist, calc_avg_dist(main_railway_stations, sub_railway_stations, [](const auto a, const auto b){ return a->pos.lat < b->pos.lat; }));
      chmin(min_avg_dist, calc_avg_dist(main_railway_stations, sub_railway_stations, [](const auto a, const auto b){ return a->pos.lng < b->pos.lng; }));
      chmin(min_avg_dist, calc_avg_dist(main_railway_stations, sub_railway_stations, [](const auto a, const auto b){ return a->pos.lat+a->pos.lng < b->pos.lat+b->pos.lng; }));
      chmin(min_avg_dist, calc_avg_dist(main_railway_stations, sub_railway_stations, [](const auto a, const auto b){ return a->info->name < b->info->name; }));
      chmin(min_avg_dist, calc_nearest_dist(main_railway_stations, sub_railway_stations));
      chmin(min_avg_dist, calc_nearest_dist(sub_railway_stations, main_railway_stations));
      if(min_avg_dist <= 1.0){
        main_sub_railway_pairs.emplace_back(main_railway.code, sub_railway.code);
        ok = true;
        break;
      }
    }
    if(ok) continue;
    unknown_railways.emplace_back(main_first->rail);
  }

  // 駅の対応付けからの路線一致判定
  std::map<int, int> same_station_pairs;
  for(const auto &x : main_sub_station_pairs){
    same_station_pairs[x.first] = x.second;
  }
  // 全部一致していれば対応付ける
  for(auto &railway : unknown_railways){
    std::set<const Railway*> cnt;
    for(const auto &station : eki_data.stations){
      if(station.rail->name != railway->name) continue;
      if(!same_station_pairs.count(station.code)) continue;
      const int sub_code = same_station_pairs[station.code];
      cnt.insert(ekispert_data.get_station(sub_code)->rail);
    }
    if((int)cnt.size() != 1) continue;
    main_sub_railway_pairs.emplace_back(railway->code, (*cnt.begin())->code);
    railway = nullptr; // delete
  }
  std::sort(unknown_railways.begin(), unknown_railways.end());
  unknown_railways.erase(std::unique(unknown_railways.begin(), unknown_railways.end()), unknown_railways.end());
  if(!unknown_railways.empty() && !unknown_railways[0]){
    unknown_railways.erase(unknown_railways.begin());
  }
}

void output_shinkansen_data(
  std::vector<std::pair<int, int>> &main_sub_station_pairs,
  std::vector<std::pair<int, int>> &main_sub_railway_pairs
){
  const std::vector<std::tuple<int,int,std::string>> shinkansen_data = {
    // { 1001, 3, "中央新幹線" },
    { 1002, 3, "東海道新幹線" },
    { 1003, 4, "山陽新幹線" },
    { 1004, 2, "東北新幹線" },
    { 1005, 2, "上越新幹線" },
    { 1007, 2, "山形新幹線" },
    { 1008, 2, "秋田新幹線" },
    { 1009, 2, "北陸新幹線" },
    { 1010, 6, "九州新幹線" },
    { 1011, 1, "北海道新幹線" },
    { 1012, 6, "西九州新幹線" },
  };
  std::set<std::string> valid_railNames = {
    "奥羽線", "上越線", "北陸線", "田沢湖線"
  };
  // kokudo_route_data only
  auto is_shinkansen_railway = [&](const std::string &railwayName) -> bool {
    return railwayName.find("新幹線") != std::string::npos || valid_railNames.count(railwayName);
  };

  for(const auto &x : shinkansen_data){
    int railwayCode, companyCode;
    std::string railwayName;
    std::tie(railwayCode, companyCode, railwayName) = x;
    for(const auto &company : eki_data.companies){
      if(company.code == companyCode){
        eki_data.railways.emplace_back(railwayCode, railwayName, &company);
        break;
      }
    }
  }

  auto find_almost_same_name_station = [](const Station *station, std::vector<Station> &stations) -> Station* {
    Station *min_st = nullptr;
    for(auto &sta : stations){
      if(!almost_same(station->info->name, sta.info->name)) continue;
      if(!min_st || station->pos.dist_km(min_st->pos) > station->pos.dist_km(sta.pos)){
        min_st = &sta;
      }
    }
    return min_st;
  };

  for(const auto &rail : ekispert_data.railways){
    if(rail.name.find("新幹線") == std::string::npos) continue;
    const std::string railName = rail.name.substr(2);
    const Railway *railway_ptr = nullptr;
    for(const auto &r : eki_data.railways){
      if(almost_same(r.name, railName)){
        railway_ptr = &r;
        break;
      }
    }
    assert(railway_ptr);
    main_sub_railway_pairs.emplace_back(railway_ptr->code, rail.code);

    // 新幹線駅の追加
    for(const auto station : ekispert_data.get_railway_stations(rail.code)){
      if(station->info->name == "越後湯沢" && rail.name.find("上越新幹線(") != std::string::npos) continue;
      const Station *min_st = find_almost_same_name_station(station, eki_data.stations);

      if(min_st && min_st->pos.dist_km(station->pos) <= 1.5){
        min_st->info->stationCnt++;
        eki_data.stations.emplace_back(10000000 + station->code, min_st->info, railway_ptr, station->pos);
      }else{
        std::string name = station->info->name;
        if(name.find('(') != std::string::npos) name = name.substr(0, name.find('('));
        eki_data.stationGroups.emplace_back(10000000 + station->code, name);
        StationGroup *group = &eki_data.stationGroups.back();
        group->stationCnt++;
        eki_data.stations.emplace_back(10000000 + station->code, group, railway_ptr, station->pos);
      }
      main_sub_station_pairs.emplace_back(eki_data.stations.back().code, station->code);
    }
  }

  auto find_main_data_shinkansen = [](const Station *station) -> std::vector<Station*> {
    std::vector<Station*> res;
    for(auto &sta : eki_data.stations){
      if(sta.rail->name.find("新幹線") == std::string::npos) continue;
      if(almost_same(station->info->name, sta.info->name)){
        res.emplace_back(&sta);
      }
    }
    return res;
  };

  auto find_similar_route_stations = [&is_shinkansen_railway](const Station *station) -> std::vector<Station*> {
    std::vector<Station*> res;
    for(auto &sta : kokudo_route_data.stations){
      if(!is_shinkansen_railway(sta.rail->name)) continue;
      if(almost_same(station->info->name, sta.info->name)){
        res.emplace_back(&sta);
      }
    }
    return res;
  };

  eki_data.build();

  // 新幹線の隣駅を求める
  // (新幹線の駅では違う場所で同じ駅名は存在しないとする)
  for(const auto &railway : eki_data.railways){
    if(railway.name.find("新幹線") == std::string::npos) continue;
    auto &one_railway_stations = eki_data.get_railway_stations_mut(railway.code);
    // 2駅が隣駅かどうか
    for(auto station : one_railway_stations){
      auto routes_stations = find_similar_route_stations(station);
      int min_left_dist = 100000;
      Station *min_left_st = nullptr;
      int min_right_dist = 100000;
      Station *min_right_st = nullptr;
      for(auto sta : one_railway_stations){
        if(station == sta) continue;
        const auto routes_stas = find_similar_route_stations(sta);
        for(const auto routes_station : routes_stations){
          for(const auto routes_sta : routes_stas){
            const int left_dist = routes_station->calc_left_station_dist(routes_sta);
            if(left_dist >= 1 && chmin(min_left_dist, left_dist)){
              min_left_st = sta;
            }
            const int right_dist = routes_station->calc_right_station_dist(routes_sta);
            if(right_dist >= 1 && chmin(min_right_dist, right_dist)){
              min_right_st = sta;
            }
          }
        }
      }
      if(min_left_st){
        station->add_left(min_left_st);
        min_left_st->add_right(station);
      }
      if(min_right_st){
        station->add_right(min_right_st);
        min_right_st->add_left(station);
      }
    }
  }

  // 重複削除
  for(auto &station : eki_data.stations){
    if(station.rail->name.find("新幹線") == std::string::npos) continue;
    std::sort(station.left.begin(), station.left.end());
    station.left.erase(std::unique(station.left.begin(), station.left.end()), station.left.end());
    std::sort(station.right.begin(), station.right.end());
    station.right.erase(std::unique(station.right.begin(), station.right.end()), station.right.end());
  }


  std::cout << "  \"shinkansen\": {\n";
  std::cout << "    \"railways\": [\n";
  bool is_first = true;
  for(const auto &rail : eki_data.railways){
    if(rail.name.find("新幹線") == std::string::npos) continue;
    if(!is_first) std::cout << ",\n";
    is_first = false;
    std::cout << "      {\n";
    std::cout << "        \"railwayCode\": " << rail.code << ",\n";
    std::cout << "        \"railwayName\": \"" << rail.name << "\",\n";
    std::cout << "        \"companyCode\": " << rail.company->code << "\n";
    std::cout << "      }";
  }
  std::cout << "\n    ],\n";

  std::cout << "    \"stations\": [\n";
  is_first = true;
  auto output_next_station = [](const std::vector<const Station*> &nexts){
    bool first = true;
    std::cout << "[";
    for(const auto next : nexts){
      if(!first) std::cout << ",";
      first = false;
      std::cout << next->code;
    }
    std::cout << "]";
  };
  for(const auto &station : eki_data.stations){
    if(station.rail->name.find("新幹線") == std::string::npos) continue;
    if(station.left.empty() && station.right.empty()) continue;
    if(!is_first) std::cout << ",\n";
    is_first = false;
    std::cout << "      {\n";
    std::cout << "        \"stationCode\": " << station.code << ",\n";
    std::cout << "        \"stationGroupCode\": " << station.info->code << ",\n";
    std::cout << "        \"stationName\": \"" << station.info->name << "\",\n";
    std::cout << "        \"railwayCode\": " << station.rail->code << ",\n";
    std::cout << "        \"railwayName\": \"" << station.rail->name << "\",\n";
    std::cout << "        \"left\": ";
    output_next_station(station.left);
    std::cout << ",\n";
    std::cout << "        \"right\": ";
    output_next_station(station.right);
    std::cout << "\n      }";
  }
  std::cout << "\n    ]\n";
  std::cout << "  },\n";
}

int main(){
  std::cin.tie(nullptr);
  std::ios::sync_with_stdio(false);

  input();

  eki_data.build();
  ekispert_data.build();
  kokudo_route_data.build();

  std::vector<std::pair<int, int>> main_sub_station_pairs;
  std::vector<const Station*> unknown_stations;

  link_stations_name(main_sub_station_pairs, unknown_stations);


  std::vector<std::pair<int, int>> main_sub_railway_pairs, main_route_railway_pairs;
  std::vector<const Railway*> unknown_railways;

  link_railways_color(main_sub_railway_pairs, unknown_railways, main_sub_station_pairs);


  // output json
  std::cout << "{\n";

  output_shinkansen_data(main_sub_station_pairs, main_sub_railway_pairs);


  std::cout << "  \"stationPairs\": [\n";
  bool isfirst = true;
  for(const auto &x : main_sub_station_pairs){
    if(!isfirst) std::cout << ",\n";
    isfirst = false;
    std::cout << "    [" << x.first << ", " << x.second << "]";
  }
  std::cout << "\n  ],\n";
  std::cout << "  \"railwayPairs\": [\n";
  isfirst = true;
  for(const auto &x : main_sub_railway_pairs){
    if(!isfirst) std::cout << ",\n";
    isfirst = false;
    std::cout << "    [" << x.first << ", " << x.second << "]";
  }
  std::cout << "\n  ],\n";
  std::cout << "  \"unknownStations\": [";
  isfirst = true;
  for(const auto station : unknown_stations){
    if(!isfirst) std::cout << ", ";
    isfirst = false;
    std::cout << station->code;
  }
  std::cout << "],\n";
  std::cout << "  \"unknownRailways\": [";
  isfirst = true;
  for(const auto railway : unknown_railways){
    if(!isfirst) std::cout << ", ";
    isfirst = false;
    std::cout << railway->code;
  }
  std::cout << "]\n";

  std::cout << "}\n";
}
