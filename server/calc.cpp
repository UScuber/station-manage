#include <iostream>
#include <vector>
#include <algorithm>
#include <cmath>
#include <queue>
#include <map>
#include <cassert>
#include <iomanip>

constexpr double PI = 3.14159265358979323846;

struct UnionFind {
  std::vector<int> d;
  UnionFind(int n): n(n), d(n, -1){}
  int root(int x){
    assert(0 <= x && x < n);
    if(d[x] < 0) return x;
    return d[x] = root(d[x]);
  }
  bool unite(int x, int y){
    x = root(x);
    y = root(y);
    if(x == y) return false;
    if(d[x] > d[y]) std::swap(x, y);
    d[x] += d[y];
    d[y] = x;
    return true;
  }
  bool same(int x, int y){
    return root(x) == root(y);
  }
  int size(int x){
    return -d[root(x)];
  }
private:
  int n;
};

double get_double(){
  int a; char c; int b;
  std::cin >> a >> c >> b;
  return a + b * 1e-5;
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

enum class RailwayType {
  LinearList,
  Circle,
  WithLoop,
  WithBranches,
  None,
};

struct NextStaInfo {
  const Station station;
  int index;
  std::vector<int> left, right;
  NextStaInfo(const Station &sta, const int idx, const std::vector<int> &dir1, const std::vector<int> &dir2) :
    station(sta), index(idx), left(dir1), right(dir2){}
  
  std::vector<int> next_list() const{
    std::vector<int> temp = left;
    temp.insert(temp.end(), right.begin(), right.end());
    return temp;
  }
  inline int size() const{
    return left.size() + right.size();
  }
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
        geo[j].push_back(get_coordinate());
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
      path.push_back(get_coordinate());
    }
    railway_paths[id].push_back(path);
  }

  for(auto &path : railway_paths){
    std::sort(path.begin(), path.end());
    path.erase(std::unique(path.begin(), path.end()), path.end());
  }
}

void search_next_station(const std::vector<Station> &railway_stations, std::vector<NextStaInfo> &next_station_data, std::vector<std::vector<Pos>> &paths){
  const int path_num = paths.size();
  // データに記述されていない交点を探す
  for(int i = 0; i < path_num; i++){
    for(const Pos &pos : std::vector<Pos>{ paths[i][0], paths[i].back() }){
      for(int j = 0; j < path_num; j++) if(i != j){
        const auto &path = paths[j];
        bool through = false;
        for(const Pos &p : path) if(p == pos){
          through = true;
          break;
        }
        if(through) break;
        for(int k = 0; k < (int)path.size()-1; k++){
          if((path[k+1]-path[k]).dot(pos-path[k]) < 0) continue;
          if((path[k]-path[k+1]).dot(pos-path[k+1]) < 0) continue;
          const double d = std::abs((path[k+1]-path[k]).cross(pos-path[k]) / (path[k+1]-path[k]).abs());
          if(d < 1e-6){
            auto &sep_path = paths[j];
            paths.emplace_back(sep_path.begin() + k, sep_path.end());
            paths.back()[0] = pos;
            sep_path.erase(sep_path.begin() + k+1, sep_path.end());
            sep_path.push_back(pos);
            through = true;
            break;
          }
        }
        if(through) break;
      }
    }
  }

  // build graph
  std::vector<Pos> pos_data;
  std::map<Pos, int> index;
  std::vector<std::vector<int>> root;
  std::vector<int> path_kinds_num;
  for(const auto &path : paths){
    int prev_idx = -1;
    for(const Pos &p : path){
      if(!index.count(p)){
        index[p] = (int)pos_data.size();
        pos_data.push_back(p);
        root.push_back({});
        path_kinds_num.push_back(0);
      }
      const int idx = index[p];
      if(prev_idx != -1){
        root[idx].push_back(prev_idx);
        root[prev_idx].push_back(idx);
      }
      path_kinds_num[idx]++;
      prev_idx = idx;
    }
  }
  // 特定のX状のpathを分離する
  for(int i = 0; i < (int)root.size(); i++){
    if((int)root[i].size() != 4) continue;
    if(path_kinds_num[i] >= 4) continue;
    // 分離
    const int last = root.size();
    for(int &x : root[root[i][2]]){
      if(x == i) x = last;
    }
    for(int &x : root[root[i][3]]){
      if(x == i) x = last;
    }
    root.push_back({ root[i][2], root[i][3] });
    root[i].pop_back(); root[i].pop_back();
    pos_data.push_back(pos_data[i]);
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
  std::vector<int> has_station(root.size(), -1);
  for(int i = 0; i < station_num; i++){
    for(const int idx : station_indices[i]){
      has_station[idx] = i;
    }
  }

  // 先端まで何もないpathを削除する,スイッチバックがある程度解決される
  for(int i = 0; i < (int)root.size(); i++){
    int p = i;
    while((int)root[p].size() == 1 && has_station[p] < 0){
      const int nxt = root[p][0];
      root[p].clear();
      root[nxt].erase(std::remove_if(root[nxt].begin(), root[nxt].end(), [&p](const int i){
        return i == p; // filter
      }), root[nxt].end());
      p = nxt;
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
        if(prev[pos] < 0 || (int)root[pos].size() == 2 || ((pos_data[x]-pos_data[pos]).arg_cos(pos_data[prev[pos]]-pos_data[pos])) < 0.33){
          visited[x] = visited[pos] + 1;
          prev[x] = pos;
          if(has_station[x] < 0 || has_station[x] == i) que.push(x);
          else next_stations.push_back(x);
        }
      }
    }
    // next stationsの方向を計算
    const int next_num = next_stations.size();
    std::vector<double> args(next_num);
    for(int j = 0; j < next_num; j++){
      int p = next_stations[j];
      while(prev[prev[p]] != -1) p = prev[p];
      args[j] = (pos_data[p] - pos_data[prev[p]]).arg();
    }
    std::vector<int> dir1_next_stations, dir2_next_stations;
    if(next_num){
      for(int j = 0; j < next_num; j++){
        if(abs(args[0] - args[j]) < 0.1 || abs(PI*2 - abs(args[0] - args[j])) < 0.1){
          dir1_next_stations.push_back(has_station[next_stations[j]]);
        }else{
          dir2_next_stations.push_back(has_station[next_stations[j]]);
        }
      }
      std::sort(dir1_next_stations.begin(), dir1_next_stations.end());
      dir1_next_stations.erase(std::unique(dir1_next_stations.begin(), dir1_next_stations.end()), dir1_next_stations.end());
      std::sort(dir2_next_stations.begin(), dir2_next_stations.end());
      dir2_next_stations.erase(std::unique(dir2_next_stations.begin(), dir2_next_stations.end()), dir2_next_stations.end());
    }
    next_station_data.emplace_back(railway_stations[i], i, dir1_next_stations, dir2_next_stations);
  }
}

std::vector<std::vector<NextStaInfo>> separate_to_connected_graph(const std::vector<NextStaInfo> &next_station_data){
  const int station_num = next_station_data.size();
  UnionFind tree(station_num);
  for(const auto &data : next_station_data){
    for(const auto &sta : data.next_list()){
      tree.unite(data.index, sta);
    }
  }
  if(tree.size(0) == station_num){
    return { next_station_data };
  }

  std::map<int, std::vector<NextStaInfo>> group;
  for(const auto &data : next_station_data){
    group[tree.root(data.index)].push_back(data);
  }
  std::vector<std::vector<NextStaInfo>> next_station_graph_data;
  for(const auto &elem : group){
    std::map<int, int> indices;
    int count = 0;
    for(const auto &data : elem.second){
      indices[data.index] = count;
      count++;
    }
    std::vector<NextStaInfo> compressed_data;
    for(const auto &data : elem.second){
      NextStaInfo info = data;
      info.index = indices[info.index];
      for(int &x : info.left) x = indices[x];
      for(int &x : info.right) x = indices[x];
      compressed_data.push_back(info);
    }
    next_station_graph_data.push_back(compressed_data);
  }
  return next_station_graph_data;
}

std::vector<NextStaInfo> calc_linear_list_graph(std::vector<NextStaInfo> graph){
  const int station_num = graph.size();
  int st = -1;
  for(int i = 0; i < station_num; i++){
    if((int)graph[i].size() == 1){
      st = i;
      break;
    }
  }
  assert(st != -1);
  int cur = st, prev = -1;
  while(prev == -1 || (int)graph[cur].size() == 2){
    for(const int x : graph[cur].next_list()){
      if(x == prev) continue;
      if(prev != -1) graph[cur].left = { prev };
      else graph[cur].left = {};
      graph[cur].right = { x };
      prev = cur;
      cur = x;
      break;
    }
  }
  graph[cur].left = { prev };
  graph[cur].right = {};
  return graph;
}

std::vector<NextStaInfo> calc_circle_graph(std::vector<NextStaInfo> graph){
  int cur = graph[0].next_list()[0], prev = 0;
  graph[0].right = { cur };
  while(cur != 0){
    for(const int x : graph[cur].next_list()){
      if(x == prev) continue;
      graph[cur].left = { prev };
      graph[cur].right = { x };
      prev = cur;
      cur = x;
      break;
    }
  }
  graph[0].left = { prev };
  return graph;
}

std::vector<NextStaInfo> calc_with_loop_graph(std::vector<NextStaInfo> graph){
  const int station_num = graph.size();
  int st = -1;
  for(int i = 0; i < station_num; i++){
    if(graph[i].size() == 1){
      st = i;
      break;
    }
  }
  assert(st != -1);
  int cur = st, prev = -1;
  bool visited_branch = false;
  while(true){
    if(graph[cur].size() <= 2){
      for(const int x : graph[cur].next_list()){
        if(x == prev) continue;
        if(prev != -1) graph[cur].left = { prev };
        else graph[cur].left = {};
        graph[cur].right = { x };
        prev = cur;
        cur = x;
        break;
      }
    }else{
      if(visited_branch) break;
      int a = -1, b = -1;
      for(const int x : graph[cur].next_list()){
        if(x == prev) continue;
        if(a < 0) a = x;
        else b = x;
      }
      if(graph[a].station.geometry[0][0] < graph[b].station.geometry[0][0]) std::swap(a, b);
      visited_branch = true;
      assert(prev != -1);
      graph[cur].left = { prev };
      graph[cur].right = { a, b };
      prev = cur;
      cur = a;
    }
  }
  return graph;
}

std::vector<NextStaInfo> calc_with_branches_graph(std::vector<NextStaInfo> graph){
  const int station_num = graph.size();
  // create dag
  std::vector<std::vector<int>> root(station_num);
  {
    std::queue<std::tuple<int, int, int>> que;
    std::vector<int> used(station_num);
    for(const int x : graph[0].right){
      root[0].push_back(x);
      que.push({ x, 0, 0 });
    }
    for(const int x : graph[0].left){
      que.push({ x, 0, 1 });
    }
    used[0] = 1;
    while(!que.empty()){
      int pos, prev, dir;
      std::tie(pos, prev, dir) = que.front();
      que.pop();
      if(used[pos]) continue;
      used[pos] = 1;
      int prev_dir = 0; // 0:left,1:right
      for(const int x : graph[pos].right){
        if(x == prev){
          prev_dir = 1;
          break;
        }
      }
      // prevから頂点が向けられている
      if(!dir){
        for(const int x : (prev_dir ? graph[pos].right : graph[pos].left)){
          if(x == prev) continue;
          que.push({ x, pos, 1 });
        }
        for(const int x : (prev_dir ? graph[pos].left : graph[pos].right)){
          root[pos].push_back(x);
          que.push({ x, pos, 0 });
        }
      }else{
        for(const int x : (prev_dir ? graph[pos].right : graph[pos].left)){
          root[pos].push_back(x);
          if(x == prev) continue;
          que.push({ x, pos, 0 });
        }
        for(const int x : (prev_dir ? graph[pos].left : graph[pos].right)){
          que.push({ x, pos, 1 });
        }
      }
    }
  }

  // tp-sort
  std::vector<int> dag(station_num);
  std::vector<int> ord;
  std::queue<int> que;
  for(int i = 0; i < station_num; i++){
    for(const int x : root[i]) dag[x]++;
  }
  for(int i = 0; i < station_num; i++){
    if(!dag[i]) que.push(i);
  }
  while(!que.empty()){
    const int pos = que.front();
    que.pop();
    ord.push_back(pos);
    for(const int x : root[pos]){
      if(!--dag[x]) que.push(x);
    }
  }

  // loop detected
  if((int)ord.size() != station_num){
    for(int i = 0; i < station_num; i++){
      if((int)graph[i].left.size() == 0 && (int)graph[i].right.size() == 2){
        std::swap(graph[i].left, graph[i].right);
      }
      if((int)graph[i].left.size() == 2 && (int)graph[i].right.size() == 0){
        graph[i].right.push_back(graph[i].left.back());
        graph[i].left.pop_back();
      }
    }

    root.assign(station_num, {});
    dag.assign(station_num, 0);
    ord.clear();

    // create dag
    {
      std::queue<std::tuple<int, int, int>> que;
      std::vector<int> used(station_num);
      for(const int x : graph[0].right){
        root[0].push_back(x);
        que.push({ x, 0, 0 });
      }
      for(const int x : graph[0].left){
        que.push({ x, 0, 1 });
      }
      used[0] = 1;
      while(!que.empty()){
        int pos, prev, dir;
        std::tie(pos, prev, dir) = que.front();
        que.pop();
        if(used[pos]) continue;
        used[pos] = 1;
        int prev_dir = 0; // 0:left,1:right
        for(const int x : graph[pos].right){
          if(x == prev){
            prev_dir = 1;
            break;
          }
        }
        // prevから頂点が向けられている
        if(!dir){
          for(const int x : (prev_dir ? graph[pos].right : graph[pos].left)){
            if(x == prev) continue;
            que.push({ x, pos, 1 });
          }
          for(const int x : (prev_dir ? graph[pos].left : graph[pos].right)){
            root[pos].push_back(x);
            que.push({ x, pos, 0 });
          }
        }else{
          for(const int x : (prev_dir ? graph[pos].right : graph[pos].left)){
            root[pos].push_back(x);
            if(x == prev) continue;
            que.push({ x, pos, 0 });
          }
          for(const int x : (prev_dir ? graph[pos].left : graph[pos].right)){
            que.push({ x, pos, 1 });
          }
        }
      }
    }

    // tp-sort
    for(int i = 0; i < station_num; i++){
      for(const int x : root[i]) dag[x]++;
    }
    for(int i = 0; i < station_num; i++){
      if(!dag[i]) que.push(i);
    }
    while(!que.empty()){
      const int pos = que.front();
      que.pop();
      ord.push_back(pos);
      for(const int x : root[pos]){
        if(!--dag[x]) que.push(x);
      }
    }
  }

  assert((int)ord.size() == station_num);

  std::vector<std::vector<int>> aligned_root(station_num);
  std::vector<int> visited(station_num);

  while(true){
    bool all_visited = true;
    for(int i = 0; i < station_num; i++){
      if(!visited[i]){
        all_visited = false;
        break;
      }
    }
    if(all_visited) break;
    std::vector<int> dp(station_num), prev(station_num, -1);
    for(const int i : ord){
      for(const int x : root[i]){
        if(visited[i] && visited[x]) continue;
        if(dp[x] < dp[i] + 1){
          dp[x] = dp[i] + 1;
          prev[x] = i;
        }
      }
    }
    const int mx_idx = std::max_element(dp.begin(), dp.end()) - dp.begin();
    assert(dp[mx_idx] >= 1);
    int cur = mx_idx;
    visited[cur] = 1;
    while(prev[cur] != -1){
      const int pre = prev[cur];
      aligned_root[pre].push_back(cur);
      visited[pre] = 1;
      cur = pre;
    }
  }

  // build
  std::vector<std::vector<int>> aligned_root_in(station_num);
  for(int i = 0; i < station_num; i++){
    for(const int x : aligned_root[i]){
      aligned_root_in[x].push_back(i);
    }
  }
  for(int i = 0; i < station_num; i++){
    graph[i].left = aligned_root_in[i];
    graph[i].right = aligned_root[i];
  }
  return graph;
}

// sが含まれるgraph
RailwayType find_railway_type(const std::vector<NextStaInfo> &graph){
  const int station_num = graph.size();
  if(station_num == 1) return RailwayType::None;
  std::vector<int> dirs_count(4);
  for(const auto &data : graph){
    const int dirs = data.size();
    if(dirs <= 3) dirs_count[dirs]++;
  }
  if(dirs_count[1] == 2 && dirs_count[2] == station_num-2) return RailwayType::LinearList;
  if(dirs_count[1] == 0 && dirs_count[2] == station_num) return RailwayType::Circle;
  if(dirs_count[1] == 1 && dirs_count[3] == 1 && dirs_count[2] == station_num-2) return RailwayType::WithLoop;
  return RailwayType::WithBranches;
}

std::vector<NextStaInfo> calculate_next_station(const int search_id){
  std::vector<NextStaInfo> next_station_data;
  std::vector<Station> railway_stations;
  for(const auto &sta : stations){
    if(sta.railway_id == search_id) railway_stations.push_back(sta);
  }
  search_next_station(railway_stations, next_station_data, railway_paths[search_id]);

  std::vector<NextStaInfo> result_next_station;
  int tot_station_num = 0;
  for(const auto &graph : separate_to_connected_graph(next_station_data)){
    for(int i = 0; i < (int)graph.size(); i++){
      assert(graph[i].index == i);
    }
    const RailwayType type = find_railway_type(graph);
    std::vector<NextStaInfo> directed_data;

    if(type == RailwayType::None){
      directed_data.push_back(graph[0]);
    }else if(type == RailwayType::LinearList){
      directed_data = calc_linear_list_graph(graph);
    }else if(type == RailwayType::Circle){
      directed_data = calc_circle_graph(graph);
    }else if(type == RailwayType::WithLoop){
      directed_data = calc_with_loop_graph(graph);
    }else{ // RailwayType::WithBranches
      directed_data = calc_with_branches_graph(graph);
    }
    for(auto &data : directed_data){
      data.index += tot_station_num;
      for(int &x : data.left) x += tot_station_num;
      for(int &x : data.right) x += tot_station_num;
    }
    assert(directed_data.size() == graph.size());
    for(const auto &data : directed_data){
      result_next_station.push_back(data);
    }
    tot_station_num += graph.size();
  }

  assert(result_next_station.size() == next_station_data.size());

  return result_next_station;
}


void output(const std::vector<NextStaInfo> &next_station_data){
  auto get_stations_json = [&](const std::vector<int> &indices, const std::string &indent){
    bool first = true;
    for(const int x : indices){
      if(!first) std::cout << ",\n";
      first = false;
      std::cout << indent << "{";
      std::cout << " \"stationCode\": \"" << next_station_data[x].station.station_code << "\" ";
      std::cout << "}";
    }
    if(!first) std::cout << "\n";
  };
  bool first = true;
  for(const auto &data : next_station_data){
    if(!first) std::cout << ",\n";
    first = false;
    std::cout << "  {\n";
    std::cout << "    \"stationCode\": \"" << data.station.station_code << "\",\n";
    std::cout << "    \"left\": [\n";
    get_stations_json(data.left, "      ");
    std::cout << "    ],\n";
    std::cout << "    \"right\": [\n";
    get_stations_json(data.right, "      ");
    std::cout << "    ]\n";
    std::cout << "  }";
  }
}

int main(){
  std::cin.tie(nullptr);
  std::ios::sync_with_stdio(false);
  input();

  std::cout << "[\n";
  for(int i = 0; i < railway_num; i++){
    const auto next_station_data = calculate_next_station(i);
    output(next_station_data);
    if(i != railway_num - 1) std::cout << ",";
    std::cout << "\n";
  }
  std::cout << "]\n";
}
