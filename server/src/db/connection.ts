import fs from "fs";
import Database, { type Statement } from "better-sqlite3";
import { Users } from "../components/user";
import { InputError } from "../shared/errors";

const db_path = process.env.DB_PATH || "./station.db";
if (!fs.existsSync(db_path)) {
  console.error(`Error: ${db_path} does not exist`);
  process.exit(1);
}

const db: InstanceType<typeof Database> = new Database(db_path);
db.pragma("journal_mode = WAL");

export const getOrThrow = <P extends unknown[], R>(
  stmt: Statement<P, R>,
  ...params: P
): R => {
  const row = stmt.get(...params);
  if (!row) throw new InputError("record not found");
  return row;
};

const usersManager = new Users(db);

export type DatabaseInstance = InstanceType<typeof Database>;

export { db, usersManager };
