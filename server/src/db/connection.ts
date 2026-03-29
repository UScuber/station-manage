import fs from "fs";
import Database, { type Statement } from "better-sqlite3";
import { Users } from "../components/user";
import { InputError } from "../shared/errors";

const db_path = process.env.DB_PATH || "./station.db";
const db_seed = process.env.DB_SEED; // テスト時のインメモリDB用: 初期データのコピー元

function exitWithError(message: string): never {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function applySeedData(
  db: InstanceType<typeof Database>,
  seedPath: string,
): void {
  // インメモリDBにファイルからデータをコピー
  const escapedSeedPath = seedPath.replace(/'/g, "''");
  db.exec(`ATTACH DATABASE '${escapedSeedPath}' AS seed`);
  try {
    db.exec("BEGIN");
    const tables = db
      .prepare<
        [],
        { name: string; sql: string }
      >("SELECT name, sql FROM seed.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all();
    for (const t of tables) {
      db.exec(t.sql);
      db.exec(`INSERT INTO main.${t.name} SELECT * FROM seed.${t.name}`);
    }
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // rollback失敗時も元のエラーを優先して再送出する
    }
    throw error;
  } finally {
    db.exec("DETACH DATABASE seed");
  }
}

function createDatabase(): InstanceType<typeof Database> {
  if (db_seed) {
    if (!fs.existsSync(db_seed)) {
      exitWithError(`DB_SEED file does not exist: ${db_seed}`);
    }
    if (db_path !== ":memory:") {
      exitWithError("DB_PATH must be ':memory:' when DB_SEED is set");
    }

    const seededDb: InstanceType<typeof Database> = new Database(db_path);
    applySeedData(seededDb, db_seed);
    return seededDb;
  }

  if (!fs.existsSync(db_path)) {
    exitWithError(`${db_path} does not exist`);
  }

  const fileDb: InstanceType<typeof Database> = new Database(db_path);
  fileDb.pragma("journal_mode = WAL");
  fileDb.pragma("busy_timeout = 5000");
  return fileDb;
}

const db: InstanceType<typeof Database> = createDatabase();

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
