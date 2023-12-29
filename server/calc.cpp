#include <iostream>
#include <vector>
#include <cmath>
#include <queue>
#include <map>
#include <cassert>

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
    static constexpr double R = M_PI / 180;
    return acos(cos(lat*R) * cos(a.lat*R) * cos(a.lng*R - lng*R) + sin(lat*R) * sin(a.lat*R)) * 6371;
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
};

struct Station {
  Pos pos;
  int railway_id;
  std::string name;
  // Station() : pos(), railway_id(-1){}
  Station(const Pos &p, const int r) : pos(p), railway_id(r){}
};

struct Path {
  std::vector<Pos> path;
  int railway_id;
  Path(const std::vector<Pos> &p, const int r) : path(p), railway_id(r){}
};

int station_num;
int railway_num;
int path_num;
std::vector<Station> stations;
std::vector<std::vector<std::vector<Pos>>> railway_paths;

void input(){
  std::cin >> station_num >> railway_num;
  for(int i = 0; i < station_num; i++){
    const Pos p(get_double(), get_double());
    int id;
    std::cin >> id;
    stations.emplace_back(p, id);
    std::cin >> stations.back().name;
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

int main(){
  input();

  const int search_id = 433;
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
  std::vector<int> station_indices;
  for(const auto &station : railway_stations){
    double min_dist = 1e9;
    int min_idx = -1;
    for(int i = 0; i < (int)pos_data.size(); i++){
      const double d = station.pos.dist(pos_data[i]);
      if(min_dist > d){
        min_dist = d;
        min_idx = i;
      }
    }
    station_indices.push_back(min_idx);
  }
  // 駅がある頂点をメモ
  std::vector<int> has_station(root.size());
  std::vector<std::string> station_name(root.size());
  for(int i = 0; i < (int)station_indices.size(); i++){
    has_station[station_indices[i]] = 1;
    station_name[station_indices[i]] = railway_stations[i].name;
  }
  // for(const int index : station_indices) has_station[index] = 1;
  // ひとつずつ探索していく
  for(int i = 0; i < (int)railway_stations.size(); i++){
    std::vector<int> next_stations;
    std::vector<int> visited(root.size(), -1);
    std::queue<int> que;
    que.push(station_indices[i]);
    visited[station_indices[i]] = 0;
    while(!que.empty()){
      const int pos = que.front();
      que.pop();
      for(const int x : root[pos]){
        if(visited[x] != -1) continue;
        visited[x] = visited[pos] + 1;
        if(!has_station[x]) que.push(x);
        else next_stations.push_back(x);
      }
    }
    std::cout << railway_stations[i].name << ": $ ";
    for(const int v : next_stations) std::cout << station_name[v] << " $ ";
    std::cout << "\n";
  }
}
