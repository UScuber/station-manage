import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp, loginTestUser, loginTestUserWithName } from "../helper";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let cookie: string;

beforeAll(async () => {
  app = createTestApp();
  await app.ready();
  cookie = await loginTestUser(app);
});

afterAll(async () => {
  await app.close();
});

const sameStationHistoryRecords = [
  { code: 1110101, date: "2025-07-01T00:00:00.000Z", state: 0 },
  { code: 1110102, date: "2025-07-02T00:00:00.000Z", state: 1 },
];

const sameGroupHistoryRecords = [
  { code: 11101010, date: "2025-07-03T00:00:00.000Z" },
];

const seedSameHistory = async (targetCookie: string) => {
  for (const record of sameStationHistoryRecords) {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie: targetCookie },
      payload: record,
    });
    expect(res.statusCode).toBe(200);
  }

  for (const record of sameGroupHistoryRecords) {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationGroupDate",
      headers: { cookie: targetCookie },
      payload: record,
    });
    expect(res.statusCode).toBe(200);
  }
};

describe("GET /api/pref/:prefCode", () => {
  it("存在する都道府県コードで都道府県情報を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/pref/1",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.prefCode).toBe(1);
    expect(body.prefName).toBe("北海道");
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/pref/1",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("範囲外の都道府県コード(0)で400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/pref/0",
    });
    expect(res.statusCode).toBe(400);
  });

  it("範囲外の都道府県コード(48)で400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/pref/48",
    });
    expect(res.statusCode).toBe(400);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/pref/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/pref", () => {
  it("全都道府県一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/pref",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(47);
    for (const pref of body) {
      expect(pref).toHaveProperty("prefCode");
      expect(pref).toHaveProperty("prefName");
    }
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/pref",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });
});

describe("GET /api/prefRailways/:prefCode", () => {
  it("存在する都道府県コードで路線一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefRailways/1",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    for (const railway of body) {
      expect(railway).toHaveProperty("railwayCode");
      expect(railway).toHaveProperty("railwayName");
    }
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefRailways/1",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefRailways/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/prefStations/:prefCode", () => {
  it("存在する都道府県コードで駅一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefStations/1",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    for (const station of body) {
      expect(station).toHaveProperty("stationCode");
      expect(station).toHaveProperty("stationName");
      expect(station).toHaveProperty("left");
      expect(station).toHaveProperty("right");
    }
  });

  it("未認証の場合visitTypeが全てNone(0)になる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefStations/1",
    });
    const body = res.json();
    for (const station of body) {
      expect(station.visitType).toBe(0);
    }
  });

  it("未認証の場合Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefStations/1",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("認証済みの場合visitTypeが数値で設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefStations/1",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    for (const station of body) {
      expect(station).toHaveProperty("visitType");
      expect(station.visitType).toBeTypeOf("number");
    }
  });

  it("認証済みの場合Cache-Controlヘッダーが設定されない", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefStations/1",
      headers: { cookie },
    });
    expect(res.headers["cache-control"]).toBeUndefined();
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefStations/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("同一履歴データでのユーザー分離(prefStations)", () => {
  let userACookie: string;
  let userBCookie: string;

  beforeAll(async () => {
    userACookie = await loginTestUserWithName(app, "都道府県分離ユーザーA");
    userBCookie = await loginTestUserWithName(app, "都道府県分離ユーザーB");
    await seedSameHistory(userACookie);
    await seedSameHistory(userBCookie);
  });

  it("同じ取得方法ならA/Bで同じ都道府県駅結果を返す", async () => {
    const [resA, resB] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/prefStations/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefStations/1",
        headers: { cookie: userBCookie },
      }),
    ]);

    expect(resA.statusCode).toBe(200);
    expect(resB.statusCode).toBe(200);
    expect(resA.json()).toEqual(resB.json());
  });

  it("Aだけ履歴を削除すると同じ取得方法でvisitTypeに差が出る", async () => {
    const [beforeA, beforeB] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/prefStations/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefStations/1",
        headers: { cookie: userBCookie },
      }),
    ]);

    const beforeBodyA = beforeA.json() as {
      stationCode: number;
      visitType: number;
    }[];
    const targetStationCode =
      beforeBodyA.find((s) => s.visitType === 0)?.stationCode ??
      beforeBodyA[0].stationCode;

    const addRes = await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie: userACookie },
      payload: {
        code: targetStationCode,
        date: "2025-07-08T00:00:00.000Z",
        state: 0,
      },
    });
    expect(addRes.statusCode).toBe(200);

    const [resA, resB] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/prefStations/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefStations/1",
        headers: { cookie: userBCookie },
      }),
    ]);
    expect(resA.statusCode).toBe(200);
    expect(resB.statusCode).toBe(200);

    const stationA = resA
      .json()
      .find(
        (s: { stationCode: number }) => s.stationCode === targetStationCode,
      );
    const stationB = resB
      .json()
      .find(
        (s: { stationCode: number }) => s.stationCode === targetStationCode,
      );
    expect(stationA).toBeDefined();
    expect(stationB).toBeDefined();
    expect(stationA.visitType).not.toBe(stationB.visitType);
  });
});
