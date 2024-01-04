#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
#include <queue>
#include <map>
#include <cassert>

constexpr double PI = 3.14159265358979323846;

double get_double(){
  int a; char c; int b;
  std::cin >> a >> c >> b;
  return a + b * 1e-5;
}

struct Pos {
  double lat,lng;
  Pos() : lat(0), lng(0){}
  Pos(const double a, const double b) : lat(a), lng(b){}
  double dist(const Pos &a) const{
    // static constexpr double R = PI / 180;
    // return acos(cos(lat*R) * cos(a.lat*R) * cos(a.lng*R - lng*R) + sin(lat*R) * sin(a.lat*R)) * 6371;
    return sqrt((lat-a.lat)*(lat-a.lat) + (lng-a.lng)*(lng-a.lng));
  }
  inline constexpr bool operator<(const Pos &a) const{
    if(lat != a.lat) return lat < a.lat;
    return lng < a.lng;
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
};

struct Station {
  std::vector<std::vector<Pos>> geometry;
  int station_code, railway_id;
  std::string railway_name, railway_company, station_name;
  Station(const std::vector<std::vector<Pos>> &g, const int s, const int r, const std::string &rn, const std::string &rc, const std::string &sn) :
    geometry(g), station_code(s), railway_id(r), railway_name(rn), railway_company(rc), station_name(sn){}
};

struct Path {
  std::vector<Pos> path;
  int railway_id;
  Path(const std::vector<Pos> &p, const int r) : path(p), railway_id(r){}
};

int railway_num;
std::vector<Station> stations;
std::vector<std::vector<std::vector<Pos>>> railway_paths;

void input(){
  int station_num, path_num;
  std::cin >> station_num >> railway_num;
  for(int i = 0; i < station_num; i++){
    int line_num;
    std::cin >> line_num;
    std::vector<std::vector<Pos>> geo(line_num);
    for(int j = 0; j < line_num; j++){
      int num;
      std::cin >> num;
      for(int k = 0; k < num; k++){
        geo[j].push_back(Pos(get_double(), get_double()));
      }
    }
    int code, id;
    std::string railway_name, company, station_name;
    std::cin >> code >> id >> railway_name >> company >> station_name;
    stations.emplace_back(geo, code, id, railway_name, company, station_name);
  }

  std::cin >> path_num;
  railway_paths.resize(railway_num);
  for(int i = 0; i < path_num; i++){
    int id, num;
    std::cin >> id >> num;
    std::vector<Pos> path;
    for(int j = 0; j < num; j++){
      path.push_back(Pos(get_double(), get_double()));
    }
    railway_paths[id].push_back(path);
  }
}

void search_next_station(const int search_id){
  std::vector<Pos> pos_data;
  std::map<Pos,int> index;
  std::vector<std::vector<int>> root;
  for(const auto &path : railway_paths[search_id]){
    int prev_idx = -1;
    for(const Pos &p : path){
      if(!index.count(p)){
        index[p] = (int)pos_data.size();
        pos_data.push_back(p);
        root.push_back({});
      }
      const int idx = index[p];
      if(prev_idx != -1){
        root[idx].push_back(prev_idx);
        root[prev_idx].push_back(idx);
      }
      prev_idx = idx;
    }
  }
  std::vector<Station> railway_stations;
  for(const auto &st : stations){
    if(st.railway_id == search_id) railway_stations.push_back(st);
  }
  const int station_num = railway_stations.size();
  std::vector<std::vector<int>> station_indices(station_num);
  for(int i = 0; i < station_num; i++){
    for(const auto &path : railway_stations[i].geometry){
      const Pos middle = path[path.size() / 2];
      double min_dist = 1e9;
      int min_idx = -1;
      for(int j = 0; j < (int)pos_data.size(); j++){
        const double d = middle.dist(pos_data[j]);
        if(min_dist > d){
          min_dist = d;
          min_idx = j;
        }
      }
      station_indices[i].push_back(min_idx);
    }
  }

  // 駅がある頂点をメモ
  std::vector<int> has_station(root.size());
  std::vector<std::string> station_name(root.size());
  for(int i = 0; i < station_num; i++){
    for(const int idx : station_indices[i]){
      has_station[idx] = 1;
      station_name[idx] = railway_stations[i].station_name;
    }
  }

  // ひとつずつ探索していく
  for(int i = 0; i < station_num; i++){
    std::vector<int> next_stations;
    std::vector<int> visited(root.size(), -1);
    std::vector<int> prev(root.size(), -1);
    std::queue<int> que;
    for(const int idx : station_indices[i]){
      visited[idx] = 0;
      que.push(idx);
    }
    while(!que.empty()){
      const int pos = que.front();
      que.pop();
      for(const int x : root[pos]){
        if(visited[x] != -1) continue;
        if(prev[pos] < 0 || (int)root[pos].size() == 2 || ((pos_data[x]-pos_data[pos]).arg_cos(pos_data[prev[pos]]-pos_data[pos])) < 0.33-0.25){
          visited[x] = visited[pos] + 1;
          prev[x] = pos;
          if(!has_station[x]) que.push(x);
          else next_stations.push_back(x);
        }
      }
    }
    std::sort(next_stations.begin(), next_stations.end());
    next_stations.erase(std::unique(next_stations.begin(), next_stations.end()), next_stations.end());
    // next stationsの方向を計算
    const int next_num = next_stations.size();
    std::vector<double> args(next_num);
    for(int j = 0; j < next_num; j++){
      int p = next_stations[j];
      while(prev[prev[p]] != -1) p = prev[p];
      const Pos sub = pos_data[p] - pos_data[prev[p]];
      args[j] = atan2(sub.lng, sub.lat);
    }
    std::vector<int> dir1_next_stations, dir2_next_stations;
    if(next_num){
      for(int j = 0; j < next_num; j++){
        if(abs(args[0] - args[j]) < 0.7 || abs(PI*2 - abs(args[0] - args[j])) < 0.7){
          dir1_next_stations.push_back(next_stations[j]);
        }else{
          dir2_next_stations.push_back(next_stations[j]);
        }
      }
    }
    std::cout << railway_stations[i].station_name << ": $ ";
    for(const int v : dir1_next_stations) std::cout << station_name[v] << " $ ";
    std::cout << "||||| $ ";
    for(const int v : dir2_next_stations) std::cout << station_name[v] << " $ ";
    std::cout << "\n";
  }
}

int main(){
  std::cin.tie(nullptr);
  std::ios::sync_with_stdio(false);
  input();

  for(int i = 0; i < railway_num; i++){
    std::cout << i << "\n";
    search_next_station(i);
    std::cout << "\n";
  }
}
