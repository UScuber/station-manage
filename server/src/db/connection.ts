import fs from "fs";
import Database, { type Statement } from "better-sqlite3";
import { Users } from "../components/user";
import { InputError } from "../shared/errors";

const db_path = process.env.DB_PATH || "./station.db";
const db_seed = process.env.DB_SEED; // テスト時のインメモリDB用: 初期データのコピー元

if (!db_seed && !fs.existsSync(db_path)) {
  console.error(`Error: ${db_path} does not exist`);
  process.exit(1);
}

if (db_seed && !fs.existsSync(db_seed)) {
  console.error(`Error: DB_SEED file does not exist: ${db_seed}`);
  process.exit(1);
}

const db: InstanceType<typeof Database> = new Database(db_path);

if (db_seed) {
  // インメモリDBにファイルからデータをコピー
  const escapedSeedPath = db_seed.replace(/'/g, "''");
  db.exec(`ATTACH DATABASE '${escapedSeedPath}' AS seed`);
  const tables = db
    .prepare(
      "SELECT name, sql FROM seed.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .all() as { name: string; sql: string }[];
  for (const t of tables) {
    db.exec(t.sql);
    db.exec(`INSERT INTO main.${t.name} SELECT * FROM seed.${t.name}`);
  }
  db.exec("DETACH DATABASE seed");
} else {
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
}

// SQLiteカスタム関数: 2点間の距離(km)を計算
db.function(
  "dist",
  (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = Math.PI / 180;
    return (
      Math.acos(
        Math.cos(lat1 * R) *
          Math.cos(lat2 * R) *
          Math.cos(lng2 * R - lng1 * R) +
          Math.sin(lat1 * R) * Math.sin(lat2 * R),
      ) * 6371
    );
  },
);

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
