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

// SQLiteカスタム関数: 2点間の距離(km)を計算
db.function("dist", (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = Math.PI / 180;
  return (
    Math.acos(
      Math.cos(lat1 * R) *
        Math.cos(lat2 * R) *
        Math.cos(lng2 * R - lng1 * R) +
        Math.sin(lat1 * R) * Math.sin(lat2 * R),
    ) * 6371
  );
});

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
