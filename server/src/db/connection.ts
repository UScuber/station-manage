import fs from "fs";
import Database, { type Database as DatabaseType } from "better-sqlite3";
import { Users } from "../components/user";

const db_path = process.env.DB_PATH || "./station.db";
if (!fs.existsSync(db_path)) {
  console.error(`Error: ${db_path} does not exist`);
  process.exit(1);
}

const db: DatabaseType = new Database(db_path);
db.pragma("journal_mode = WAL");

const usersManager = new Users(db);

export { db, usersManager };
