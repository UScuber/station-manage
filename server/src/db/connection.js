const fs = require("fs");
const sqlite3 = require("better-sqlite3");
const { Users } = require("../components/user");

const db_path = process.env.DB_PATH || "./station.db";
if (!fs.existsSync(db_path)) {
  console.error(`Error: ${db_path} does not exist`);
  process.exit(1);
}

const db = sqlite3(db_path);
db.pragma("journal_mode = WAL");

const usersManager = new Users(db);

exports.db = db;
exports.usersManager = usersManager;
