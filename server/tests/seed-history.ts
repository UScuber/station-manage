import { expect } from "vitest";
import type { FastifyInstance } from "fastify";

/** ユーザー分離テスト用の共通駅履歴レコード */
export const SEED_STATION_HISTORY_RECORDS = [
  { code: 1110101, date: "2025-07-01T00:00:00.000Z", state: 0 },
  { code: 1110102, date: "2025-07-02T00:00:00.000Z", state: 1 },
] as const;

/** ユーザー分離テスト用の共通グループ履歴レコード */
export const SEED_GROUP_HISTORY_RECORDS = [
  { code: 11101010, date: "2025-07-03T00:00:00.000Z" },
] as const;

/** テスト用の駅履歴・グループ履歴を登録する */
export const seedHistory = async (
  app: FastifyInstance,
  cookie: string,
): Promise<void> => {
  for (const record of SEED_STATION_HISTORY_RECORDS) {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie },
      payload: record,
    });
    expect(res.statusCode).toBe(200);
  }

  for (const record of SEED_GROUP_HISTORY_RECORDS) {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationGroupDate",
      headers: { cookie },
      payload: record,
    });
    expect(res.statusCode).toBe(200);
  }
};
