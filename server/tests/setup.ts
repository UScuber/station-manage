import path from "path";

const TEST_DB_SRC = path.resolve(__dirname, "../station-initial.db");

// インメモリDBを使用（ファイル作成なし・並列実行時の競合なし）
process.env.DB_PATH = ":memory:";
process.env.DB_SEED = TEST_DB_SRC;
