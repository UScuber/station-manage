import fs from "fs";
import path from "path";

const TEST_DB_SRC = path.resolve(__dirname, "../station-initial.db");
const TEST_DB_PATH = path.resolve(__dirname, "../station-test.db");

// connection.ts より先に実行される必要がある
fs.copyFileSync(TEST_DB_SRC, TEST_DB_PATH);
