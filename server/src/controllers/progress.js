const { db } = require("../db/connection");


// 路線の駅の個数と乗降/通過した駅の個数を取得
// /api/railwayProgress/:railwayCode
exports.railwayProgress = async (request, reply) => {
  const railwayCode = request.params.railwayCode;
  const userId = request.userId;

  const stationNum = db.prepare(`
    SELECT COUNT(*) AS num FROM Stations
    WHERE railwayCode = ?
  `).get(railwayCode);

  const getOrPassStationNum = db.prepare(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
        AND Stations.railwayCode = ?
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.userId = ?
  `).get(railwayCode, userId);

  return { stationNum: stationNum.num, getOrPassStationNum: getOrPassStationNum.num };
};


// 会社の各路線の駅の個数と乗降/通過した駅の個数を取得
// /api/railwayProgressList/:companyCode
exports.railwayProgressList = async (request, reply) => {
  const companyCode = request.params.companyCode;
  const userId = request.userId;

  const stationNumList = db.prepare(`
    SELECT COUNT(*) as num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
        AND Railways.companyCode = ?
    GROUP BY Stations.railwayCode
    ORDER BY Stations.railwayCode
  `).all(companyCode);

  const getOrPassStationNumList = db.prepare(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
        AND Railways.companyCode = ?
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.userId = ?
    GROUP BY Stations.railwayCode
    ORDER BY Stations.railwayCode
  `).all(companyCode, userId);

  return stationNumList.map((elem, idx) => ({
    stationNum: elem.num,
    getOrPassStationNum: getOrPassStationNumList[idx].num,
  }));
};


// 指定された都道府県に駅がが存在する路線の駅の個数と乗降/通過した駅の個数を取得
// /api/prefRailwayProgressList/:prefCode
exports.railwayProgressListByPref = async (request, reply) => {
  const prefCode = request.params.prefCode;
  const userId = request.userId;

  const stationNumList = db.prepare(`
    WITH RailData AS (
      SELECT Stations.railwayCode FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND StationGroups.prefCode = ?
      GROUP BY Stations.railwayCode
    )
    SELECT COUNT(*) AS num FROM Stations
    INNER JOIN RailData
      ON Stations.railwayCode = RailData.railwayCode
    GROUP BY Stations.railwayCode
    ORDER BY Stations.railwayCode
  `).all(prefCode);

  const getOrPassStationNumList = db.prepare(`
    WITH RailData AS (
      SELECT Stations.railwayCode FROM Stations
      INNER JOIN StationGroups
        ON Stations.stationGroupCode = StationGroups.stationGroupCode
          AND StationGroups.prefCode = ?
      GROUP BY Stations.railwayCode
    )
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN RailData
      ON Stations.railwayCode = RailData.railwayCode
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.userId = ?
    GROUP BY Stations.railwayCode
    ORDER BY Stations.railwayCode
  `).all(prefCode, userId);

  return stationNumList.map((elem, idx) => ({
    stationNum: elem.num,
    getOrPassStationNum: getOrPassStationNumList[idx].num,
  }));
};


// 全会社の各路線の駅の個数と乗降/通過した駅の個数のリストを取得
// /api/railwayProgressList
exports.railwayProgressListAll = async (request, reply) => {
  const userId = request.userId;

  const stationNumList = db.prepare(`
    SELECT COUNT(*) as num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    GROUP BY Stations.railwayCode
    ORDER BY Stations.railwayCode
  `).all();

  const getOrPassStationNumList = db.prepare(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.userId = ?
    GROUP BY Stations.railwayCode
    ORDER BY Stations.railwayCode
  `).all(userId);

  return stationNumList.map((elem, idx) => ({
    stationNum: elem.num,
    getOrPassStationNum: getOrPassStationNumList[idx].num,
  }));
};


// 会社の駅の個数と乗降/通過した駅の個数を取得
// /api/companyProgress/:companyCode
exports.companyProgress = async (request, reply) => {
  const companyCode = request.params.companyCode;
  const userId = request.userId;

  const stationNum = db.prepare(`
    SELECT COUNT(*) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
        AND Railways.companyCode = ?
  `).get(companyCode);

  const getOrPassStationNum = db.prepare(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
        AND Railways.companyCode = ?
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.userId = ?
  `).get(companyCode, userId);

  return { stationNum: stationNum.num, getOrPassStationNum: getOrPassStationNum.num };
};


// 全会社の駅の個数と乗降/通過した駅の個数のリストを取得
// /api/companyProgress
exports.companyProgressList = async (request, reply) => {
  const userId = request.userId;

  const stationNumList = db.prepare(`
    SELECT COUNT(*) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    GROUP BY Railways.companyCode
    ORDER BY Railways.companyCode
  `).all();

  const getOrPassStationNumList = db.prepare(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN Railways
      ON Stations.railwayCode = Railways.railwayCode
    LEFT JOIN LatestStationHistory
      ON Stations.stationCode = LatestStationHistory.stationCode
        AND LatestStationHistory.userId = ?
    GROUP BY Railways.companyCode
    ORDER BY Railways.companyCode
  `).all(userId);

  return stationNumList.map((data, idx) => ({
    stationNum: data.num,
    getOrPassStationNum: getOrPassStationNumList[idx].num,
  }));
};


// 都道府県の駅の個数と乗降/通過した駅の個数を取得(駅グループを1つとはしない)
// /api/prefProgress/:prefCode
exports.prefProgress = async (request, reply) => {
  const prefCode = request.params.prefCode;
  const userId = request.userId;

  const stationNum = db.prepare(`
    SELECT COUNT(*) AS num FROM Stations
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
        AND StationGroups.prefCode = ?
  `).get(prefCode);

  const getOrPassStationNum = db.prepare(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
        AND StationGroups.prefCode = ?
    LEFT JOIN LatestStationHistory
      ON LatestStationHistory.stationCode = Stations.stationCode
        AND LatestStationHistory.userId = ?
  `).get(prefCode, userId);

  return { stationNum: stationNum.num, getOrPassStationNum: getOrPassStationNum.num };
};


// 全国の駅の個数と乗降/通過した駅の個数を取得(駅グループを1つとはしない)
// /api/prefProgress
exports.prefProgressList = async (request, reply) => {
  const userId = request.userId;

  const stationNumList = db.prepare(`
    SELECT COUNT(*) AS num FROM Stations
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
    GROUP BY StationGroups.prefCode
    ORDER BY StationGroups.prefCode
  `).all();

  const getOrPassStationNumList = db.prepare(`
    SELECT COUNT(DISTINCT
      CASE
        WHEN LatestStationHistory.date IS NULL THEN NULL
        ELSE LatestStationHistory.stationCode
      END
    ) AS num FROM Stations
    INNER JOIN StationGroups
      ON Stations.stationGroupCode = StationGroups.stationGroupCode
    LEFT JOIN LatestStationHistory
      ON LatestStationHistory.stationCode = Stations.stationCode
        AND LatestStationHistory.userId = ?
    GROUP BY StationGroups.prefCode
    ORDER BY StationGroups.prefCode
  `).all(userId);

  return stationNumList.map((data, idx) => ({
    stationNum: data.num,
    getOrPassStationNum: getOrPassStationNumList[idx].num,
  }));
};
