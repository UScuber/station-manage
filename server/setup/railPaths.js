class UnionFind {
  constructor(n) {
    this.d = new Array(n).fill(-1);
  }
  root(x) {
    if (this.d[x] < 0) return x;
    return (this.d[x] = this.root(this.d[x]));
  }
  unite(_x, _y) {
    let x = _x,
      y = _y;
    x = this.root(x);
    y = this.root(y);
    if (x === y) return false;
    if (this.d[x] > this.d[y]) [x, y] = [y, x];
    this.d[x] += this.d[y];
    this.d[y] = x;
    return true;
  }
  same(x, y) {
    return this.root(x) === this.root(y);
  }
  size(x) {
    return -this.d[this.root(x)];
  }
}

class CalcRailwayPath {
  constructor(graph) {
    this.graph = graph;
    this.type = Object.freeze({
      None: 0,
      LinearList: 1,
      Circle: 2,
      WithLoop: 3,
      WithBranches: 4,
    });
  }

  get_graph_paths() {
    let tree = new UnionFind(this.graph.length);
    for (let i = 0; i < this.graph.length; i++) {
      for (let j = 0; j < this.graph[i].length; j++) {
        tree.unite(i, this.graph[i][j]);
      }
    }

    let paths = []; // indices
    for (let i = 0; i < this.graph.length; i++) {
      if (tree.root(i) !== i) continue;
      const path = this.get_path(i, tree);
      paths.push(path);
    }

    return paths;
  }

  get_path(st, tree) {
    let path = []; // indices

    switch (this.get_graph_type(st, tree)) {
      case this.type.None:
        break;
      case this.type.LinearList:
        path = this.linear_list_graph(st, tree);
        break;
      case this.type.Circle:
        path = this.circle_graph(st, tree);
        break;
      case this.type.WithLoop:
        path = this.with_loop_graph(st, tree);
        break;
      case this.type.WithBranches:
        path = this.with_branches_graph(st, tree);
        break;
    }
    return path;
  }

  min_dirs_poses(st, tree) {
    const root = tree.root(st);
    let info = [];
    let min_dirs = 10;
    for (let i = 0; i < this.graph.length; i++) {
      if (tree.root(i) !== root) continue;
      const d = this.graph[i].length;
      info.push({ pos: i, dir: d });
      if (min_dirs > d) min_dirs = d;
    }
    return info.filter((elem) => elem.dir === min_dirs).map((elem) => elem.pos);
  }

  linear_list_graph(st, tree) {
    const start_pos = this.min_dirs_poses(st, tree)[0];
    let cur = start_pos,
      prev = -1;

    let path = [cur];
    while (true) {
      if (prev !== this.graph[cur][0]) {
        prev = cur;
        cur = this.graph[cur][0];
      } else if (this.graph[cur].length >= 2) {
        prev = cur;
        cur = this.graph[cur][1];
      } else break;
      path.push(cur);
    }
    return path;
  }

  circle_graph(st, tree) {
    const start_pos = this.min_dirs_poses(st, tree)[0];
    let cur = start_pos,
      prev = -1;

    let path = [];
    while (true) {
      path.push(cur);
      if (prev !== this.graph[cur][0]) {
        prev = cur;
        cur = this.graph[cur][0];
      } else {
        prev = cur;
        cur = this.graph[cur][1];
      }
      if (cur === start_pos) break;
    }
    path.push(cur);
    return path;
  }

  with_loop_graph(st, tree) {
    const start_pos = this.min_dirs_poses(st, tree)[0];
    let cur = start_pos,
      prev = -1;
    let visited_branch = false;

    let path = [];
    while (true) {
      path.push(cur);
      if (this.graph[cur].length <= 2) {
        if (prev !== this.graph[cur][0]) {
          prev = cur;
          cur = this.graph[cur][0];
        } else if (this.graph[cur].length >= 2) {
          prev = cur;
          cur = this.graph[cur][1];
        }
      } else {
        if (visited_branch) {
          break;
        }
        visited_branch = true;
        if (prev !== this.graph[cur][0]) {
          prev = cur;
          cur = this.graph[cur][0];
        } else {
          prev = cur;
          cur = this.graph[cur][1];
        }
      }
    }
    return path;
  }

  with_branches_graph(st, tree) {
    let edges_num = 0;
    const root = tree.root(st);
    for (let i = 0; i < this.graph.length; i++) {
      if (root !== tree.root(i)) continue;
      edges_num += this.graph[i].length;
    }
    edges_num >>= 1;

    let path = [];
    let visited = {};

    const dfs = (pos, par) => {
      path.push(pos);
      edges_num--;
      if (edges_num < 0) return;
      if (pos in visited) return;
      visited[pos] = true;
      for (let i = 0; i < this.graph[pos].length; i++) {
        const p = this.graph[pos][i];
        if (p === par) continue;
        dfs(p, pos);
        if (edges_num < 0) return;
        path.push(pos);
      }
    };
    dfs(st, -1);

    return path;
  }

  get_graph_type(st, tree) {
    const root = tree.root(st);
    let dirs_count = [0, 0, 0, 0];
    let station_num = 0;
    for (let i = 0; i < this.graph.length; i++) {
      if (tree.root(i) !== root) continue;
      const d = this.graph[i].length;
      if (d <= 3) dirs_count[d]++;
      station_num++;
    }
    if (station_num === 1) return this.type.None;
    if (dirs_count[1] == 2 && dirs_count[2] == station_num - 2)
      return this.type.LinearList;
    if (dirs_count[1] == 0 && dirs_count[2] == station_num)
      return this.type.Circle;
    if (
      dirs_count[1] == 1 &&
      dirs_count[3] == 1 &&
      dirs_count[2] == station_num - 2
    )
      return this.type.WithLoop;
    return this.type.WithBranches;
  }
}

class RailPaths {
  constructor(next_station_data, station_data) {
    this.next_station = next_station_data;
    this.station = station_data;
    this.positions = {};
    this.railway_station = {};
    this.station.forEach((data) => {
      this.positions[data.stationCode] = [data.lat, data.lng];
      if (!(data.railwayCode in this.railway_station)) {
        this.railway_station[data.railwayCode] = [];
      }
      this.railway_station[data.railwayCode].push(data.stationCode);
    });

    this.graph = {};
    this.next_station.forEach((data) => {
      this.graph[data.stationCode] = data.left.concat(data.right);
    });
  }

  getRailwayList() {
    return Object.keys(this.railway_station).map((code) => code);
  }

  getPaths(railwayCode) {
    const railway_num = this.railway_station[railwayCode].length;

    let indices = {};
    for (let i = 0; i < railway_num; i++) {
      indices[this.railway_station[railwayCode][i]] = i;
    }

    let railway_graph = new Array(railway_num).fill().map((_) => []);
    for (let i = 0; i < railway_num; i++) {
      const pos = this.railway_station[railwayCode][i];
      for (let j = 0; j < this.graph[pos].length; j++) {
        railway_graph[i].push(indices[this.graph[pos][j]]);
      }
    }

    const paths = new CalcRailwayPath(railway_graph).get_graph_paths();
    return paths.map((path) =>
      path.map((pos) => this.positions[this.railway_station[railwayCode][pos]])
    );
  }
}

exports.RailPaths = RailPaths;
