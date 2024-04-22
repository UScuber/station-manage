class RailPaths {
  constructor(next_station_data, station_data){
    this.next_station = next_station_data;
    this.station = station_data;
    this.positions = {};
    this.railway_station = {};
    this.station.forEach(data => {
      this.positions[data.stationCode] = [data.lat, data.lng];
      if(!(data.railwayCode in this.railway_station)){
        this.railway_station[data.railwayCode] = [];
      }
      this.railway_station[data.railwayCode].push(data.stationCode);
    });

    this.graph = {};
    this.next_station.forEach(data => {
      this.graph[data.stationCode] = data.left.concat(data.right);
    });
  }

  getRailwayList(){
    return Object.keys(this.railway_station).map(code => code);
  }

  getPaths(railwayCode){
    let paths = [];
    let visited = {};
    const railway_num = this.railway_station[railwayCode].length;
    for(let i = 0; i < railway_num; i++){
      // 次数が1の頂点があれば探してDFSで一筆書きをする
      const stationCode = this.railway_station[railwayCode][i];
      if(stationCode in visited) continue;
      let path = [];
      this.dfs(stationCode, -1, path, visited);
      paths.push(path.map(code => this.positions[code]));
    }
    return paths;
  }

  dfs(pos, par, path, visited){
    path.push(pos);
    if(pos in visited) return;
    visited[pos] = true;
    for(let i = 0; i < this.graph[pos].length; i++){
      const p = this.graph[pos][i];
      if(p === par) continue;
      this.dfs(p, pos, path, visited);
      path.push(pos);
    }
  }
};

exports.RailPaths = RailPaths;
