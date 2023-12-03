const fs = require("fs");
const express = require("express");
const sqlite3 = require("sqlite3");

const db_path = "./station.db";
if(!fs.existsSync(db_path)){
  console.error(`Error: ${db_path} does not exist`);
  process.exit(1);
}

const PORT = process.env.PORT || 3001;
const app = express();

const db = new sqlite3.Database(db_path);

app.get("/", (req, res) => {
  res.end("OK");
});

app.get("/api", (req, res) => {
  res.json({ res: "OK" });
});

app.get("/api/station/:stationCode", (req, res) => {
  const code = req.params.stationCode;
  db.get(`
      SELECT * FROM StationCodes
      INNER JOIN StationNames
        ON StationCodes.stationGroupCode = StationNames.stationGroupCode
          AND StationCodes.stationCode = ?
    `,
    code,
    (err, data) => {
      if(err) console.error(err);
      res.json(data);
    }
  );
});

app.get("/api/searchStationName", (req, res) => {
  const name = req.query.name;
  if(name === undefined){
    res.json({});
    return;
  }
  db.all(`
      SELECT * FROM StationCodes
      INNER JOIN StationNames
        ON StationCodes.stationGroupCode = StationNames.stationGroupCode
          AND StationNames.stationName = ?
    `,
    name,
    (err, data) => {
      if(err) console.error(err);
      res.json(data);
    }
  );
});

app.get("/api/stationState/:stationCode", (req, res) => {
  const code = req.params.stationCode;
  db.get(
    "SELECT * FROM StationState WHERE stationCode = ?",
    code,
    (err, data) => {
      if(err) console.error(err);
      res.json(data);
    }
  );
});

app.get("/api/stationGroupState/:stationGroupCode", (req, res) => {
  const code = req.params.stationGroupCode;
  db.get(
    "SELECT * FROM StationGroupState WHERE stationGroupCode = ?",
    code,
    (err, data) => {
      if(err) console.error(err);
      res.json(data);
    }
  );
});

app.listen(PORT);
console.log(`Server running at ${PORT}`);
