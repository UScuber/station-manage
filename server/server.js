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

const convert_date = (date) => {
  const date_options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return date ? new Date(date).toLocaleString("ja-JP", date_options).replaceAll("/", "-") : undefined;
};


const accessLog = (req, res, next) => {
  console.log(`\x1b[33m[${convert_date(new Date())}]\x1b[39m`, req.method, req.originalUrl);
  next();
};

app.get("/", accessLog, (req, res) => {
  res.end("OK");
});

app.get("/api", accessLog, (req, res) => {
  res.json({ res: "OK" });
});


app.get("/api/station/:stationCode", accessLog, (req, res, next) => {
  const code = req.params.stationCode;
  db.get(`
      SELECT Stations.*, StationGroups.stationName FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND Stations.stationCode = ?
    `,
    code,
    (err, data) => {
      if(err){
        console.error(err);
        next(new Error("Server Error"));
      }else if(!data){
        next(new Error("Server Error: Invalid input"));
      }else{
        res.json(data);
      }
    }
  );
});


app.get("/api/stationGroup/:stationGroupCode", accessLog, (req, res) => {
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

app.get("/api/stationsByGroupCode/:stationGroupCode", accessLog, (req, res) => {
  const code = req.params.stationGroupCode;
  db.all(`
      SELECT Stations.*, StationGroups.stationName, StationGroups.date FROM Stations
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

app.get("/api/searchStationName", accessLog, (req, res) => {
  const name = req.query.name;
  if(name === undefined){
    res.json({});
    return;
  }
  db.all(`
      WITH StationData AS (
        SELECT Stations.*, StationGroups.stationName, StationGroups.date FROM Stations
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

app.get("/api/searchNearestStationGroup", accessLog, (req, res) => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const num = req.query.num ? Math.min(Number(req.query.num), 20) : 20;
  if(lat === undefined || lng == undefined){
    res.json({});
    return;
  }
  db.all(`
      SELECT StationGroups.*, (
        6371 * ACOS(
          COS(RADIANS(?)) * COS(RADIANS(latitude)) * COS(RADIANS(longitude) - RADIANS(?))
          + SIN(RADIANS(?)) * SIN(RADIANS(latitude))
        )
      ) AS distance
      FROM StationGroups
      ORDER BY distance
      LIMIT ?
    `,
    lat,lng,lat, num,
    (err, data) => {
      if(err) console.error(err);
      res.json(data);
    }
  );
});

// check
app.get("/api/stationState/:stationCode", accessLog, (req, res) => {
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

app.get("/api/stationGroupState/:stationGroupCode", accessLog, (req, res) => {
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

app.get("/api/stationGroupList", accessLog, (req, res) => {
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

app.get("/api/searchStationGroupList", accessLog, (req, res) => {
  const off = req.query.off;
  const len = req.query.len;
  const name = req.query.name ?? "";
  if(off === undefined || len === undefined){
    res.json({});
    return;
  }
  db.all(`
        SELECT 0 AS ord, StationGroups.* FROM StationGroups
          WHERE stationName = ?
      UNION ALL
        SELECT 1 AS ord, StationGroups.* FROM StationGroups
          WHERE stationName LIKE ?
      UNION ALL
        SELECT 2 AS ord, StationGroups.* FROM StationGroups
          WHERE stationName LIKE ?
      UNION ALL
        SELECT 3 AS ord, StationGroups.* FROM StationGroups
          WHERE stationName LIKE ?
      ORDER BY ord
      LIMIT ? OFFSET ?
    `,
    name,`${name}_%`,`_%${name}`,`_%${name}_%`,
    len, off,
    (err, data) => {
      if(err) console.error(err);
      res.json(data);
    }
  );
});

app.get("/api/searchStationGroupCount", accessLog, (req, res) => {
  const name = req.query.name ?? "";
  db.get(`
    SELECT COUNT(*) AS count FROM StationGroups
      WHERE stationName = ?
        OR stationName LIKE ?
        OR stationName LIKE ?
        OR stationName LIKE ?
    `,
    name,`${name}_%`,`_%${name}`,`_%${name}_%`,
    (err, data) => {
      if(err) console.error(err);
      res.json(data.count);
    }
  );
});

app.get("/api/stationGroupCount", accessLog, (req, res) => {
  db.get(
    "SELECT COUNT(*) AS count FROM StationGroups",
    (err, data) => {
      if(err) console.error(err);
      res.json(data.count);
    }
  );
});

app.get("/api/stationHistory", accessLog, (req, res) => {
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

app.get("/api/stationHistoryCount", accessLog, (req, res) => {
  db.get(
    "SELECT COUNT(*) AS count FROM StationHistory",
    (err, data) => {
      if(err) console.error(err);
      res.json(data.count);
    }
  );
});

app.get("/api/postStationDate", accessLog, (req, res) => {
  const code = req.query.code;
  const date = convert_date(req.query.date);
  const state = req.query.state;
  if(code === undefined || date === undefined || state === undefined || state < 0 || state >= 2){
    res.end("NG");
    return;
  }
  db.run(
    "INSERT INTO StationHistory VALUES(?, datetime(?), ?)",
    code, date, state,
    (err, data) => {
      if(err){
        console.error(err);
        res.end("error");
      }else{
        const value_name = ["getDate", "passDate"][state];
        db.run(
          `UPDATE Stations SET ${value_name} = MAX(IFNULL(${value_name}, 0), datetime(?)) WHERE stationCode = ?`,
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

app.get("/api/postStationGroupDate", accessLog, (req, res) => {
  const code = req.query.code;
  const date = convert_date(req.query.date);
  if(code === undefined || date === undefined){
    res.end("NG");
    return;
  }
  db.run(
    "INSERT INTO StationGroupHistory VALUES(?, datetime(?))",
    code, date,
    (err, data) => {
      if(err){
        console.error(err);
        res.end("error");
      }else{
        db.run(
          `UPDATE StationGroups SET date = MAX(IFNULL(date, 0), datetime(?)) WHERE stationGroupCode = ?`,
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

app.get("/api/deleteStationDate", accessLog, (req, res) => {
  const code = req.query.code;
  const date = convert_date(req.query.date);
  const state = req.query.state;
  if(code === undefined || date === undefined || state === undefined || state < 0 || state >= 2){
    res.end("NG");
    return;
  }
  db.run(`
    DELETE FROM StationHistory
    WHERE stationCode = ? AND date = datetime(?) AND state = ?
    `,
    code, date, state,
    (err, data) => {
      if(err){
        console.error(err);
        res.end("error");
      }else{
        const value_name = ["getDate", "passDate"][state];
        db.run(`
          UPDATE Stations SET ${value_name} = (
            SELECT MAX(date) FROM StationHistory
            WHERE stationCode = ? AND state = ?
          )
          WHERE stationCode = ? AND ${value_name} = datetime(?)
        `,
        code, state, code, date,
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

app.get("/api/deleteStationGroupState", accessLog, (req, res) => {
  const code = req.query.code;
  const date = convert_date(req.query.date);
  if(code === undefined || date === undefined){
    res.end("NG");
    return;
  }
  db.run(`
    DELETE FROM StationGroupHistory
    WHERE stationCode = ? AND date = datetime(?)
    `,
    code, date,
    (err, data) => {
      if(err){
        console.error(err);
        res.end("error");
      }else{
        db.run(`
          UPDATE StationGroupHistory SET date = (
            SELECT MAX(date) FROM StationGroupHistory
            WHERE stationGroupCode = ?
          )
          WHERE stationGroupCode = ? AND date = datetime(?)
          `,
          code, code, date,
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


app.use((err, req, res, next) => {
  console.error(`\x1b[31m[${err.name}] ${err.message}\x1b[39m`, err.stack.substr(err.stack.indexOf("\n")));
  res.status(500).send(err.message);
});

app.listen(PORT);
console.log(`Server running at ${PORT}`);
