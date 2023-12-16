const fs = require("fs");
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3");
require("dotenv").config();

const db_path = "./station.db";
if(!fs.existsSync(db_path)){
  console.error(`Error: ${db_path} does not exist`);
  process.exit(1);
}

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors({
  origin: [process.env.REACT_URL, "http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200,
}));

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
      SELECT * FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND Stations.stationCode = ?
    `,
    code,
    (err, data) => {
      if(err) console.error(err);
      res.json(data);
    }
  );
});


app.get("/api/stationGroup/:stationGroupCode", (req, res) => {
  const code = req.params.stationGroupCode;
  db.get(`
      SELECT StationGroups.*, MAX(getDate) AS maxGetDate, MAX(passDate) AS maxPassDate FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND Stations.stationGroupCode = ?
      GROUP BY Stations.stationGroupCode
    `,
    code,
    (err, data) => {
      if(err) console.error(err);
      res.json(data);
    }
  );
});

app.get("/api/stationsByGroupCode/:stationGroupCode", (req, res) => {
  const code = req.params.stationGroupCode;
  db.all(`
      SELECT * FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND Stations.stationGroupCode = ?
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
      WITH StationData AS (
        SELECT * FROM Stations
        INNER JOIN StationGroups
          ON Stations.stationGroupCode = StationGroups.stationGroupCode
      )
        SELECT 0 AS ord, StationData.* FROM StationData
          WHERE stationName = ?
      UNION ALL
        SELECT 1 AS ord, StationData.* FROM StationData
          WHERE stationName LIKE ?
      UNION ALL
        SELECT 2 AS ord, StationData.* FROM StationData
          WHERE stationName LIKE ?
      UNION ALL
        SELECT 3 AS ord, StationData.* FROM StationData
          WHERE stationName LIKE ?
      ORDER BY ord
    `,
    name,`${name}_%`,`_%${name}`,`_%${name}_%`,
    (err, data) => {
      if(err) console.error(err);
      data = data.map((item) => {
        delete item.ord;
        return item;
      });
      res.json(data);
    }
  );
});

app.get("/api/searchNearestStationGroup", (req, res) => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  if(lat === undefined || lng == undefined){
    res.json({});
    return;
  }
  db.all(`
      SELECT * FROM StationGroups
      WHERE (
        6371 * ACOS(
          COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?))
          + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
        )
      ) = (
        SELECT MIN(
          6371 * ACOS(
            COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?))
            + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
          )
        )
        FROM StationGroups
      )
    `,
    lat,lng,lat, lat,lng,lat,
    (err, data) => {
      if(err) console.error(err);
      res.json(data[0]);
    }
  );
});

// check
app.get("/api/stationState/:stationCode", (req, res) => {
  const code = req.params.stationCode;
  db.get(
    "SELECT * FROM Stations WHERE stationCode = ?",
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
    "SELECT * FROM StationGroups WHERE stationGroupCode = ?",
    code,
    (err, data) => {
      if(err) console.error(err);
      res.json(data);
    }
  );
});

app.get("/api/stationGroupList", (req, res) => {
  const off = req.query.off;
  const len = req.query.len;
  if(off === undefined || len === undefined){
    res.json({});
    return;
  }
  db.all(`
      SELECT * FROM StationGroups
      ORDER BY stationGroupCode
      LIMIT ? OFFSET ?
    `,
    len, off,
    (err, data) => {
      if(err) console.error(err);
      res.json(data);
    }
  );
});

app.get("/api/stationHistory", (req, res) => {
  const off = req.query.off;
  const len = req.query.len;
  if(off === undefined || len === undefined){
    res.json({});
    return;
  }
  db.all(
    "SELECT * FROM StationHistory ORDER BY date DESC LIMIT ? OFFSET ?",
    len, off,
    (err, data) => {
      if(err) console.error(err);
      res.json(data);
    }
  );
});

const date_options = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

app.get("/api/postStationDate", (req, res) => {
  const code = req.query.code;
  let date = req.query.date;
  const state = req.query.state;
  if(code === undefined || date === undefined || state === undefined || state < 0 || state >= 2){
    res.end("NG");
    return;
  }
  date = new Date(date).toLocaleString("ja-jp", date_options).replaceAll("/", "-");
  db.run(
    "INSERT INTO StationHistory VALUES(?,datetime(?),?)",
    code, date, state,
    (err, data) => {
      if(err){
        console.error(err);
        res.end("error");
      }else{
        const valueName = ["getDate", "passDate"][state];
        db.run(
          `UPDATE Stations SET ${valueName} = datetime(?) WHERE stationCode = ?`,
          date, code,
          (e, d) => {
            if(e){
              console.error(e);
              res.end("error");
            }else{
              res.end("OK");
            }
          }
        );
      }
    }
  );
});

app.get("/api/postStationGroupDate", (req, res) => {
  const code = req.query.code;
  let date = req.query.date;
  if(code === undefined || date === undefined){
    res.end("NG");
    return;
  }
  date = new Date(date).toLocaleString("ja-jp", date_options).replaceAll("/", "-");
  db.run(
    "INSERT INTO StationGroupHistory VALUES(?,datetime(?))",
    code, date,
    (err, data) => {
      if(err){
        console.error(err);
        res.end("error");
      }else{
        db.run(
          `UPDATE StationGroups SET date = datetime(?) WHERE stationGroupCode = ?`,
          date, code,
          (e, d) => {
            if(e){
              console.error(e);
              res.end("error");
            }else{
              res.end("OK");
            }
          }
        );
      }
    }
  );
});


app.listen(PORT);
console.log(`Server running at ${PORT}`);
