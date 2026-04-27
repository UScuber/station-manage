import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp, loginTestUser, loginTestUserWithName } from "../helper";
import { seedHistory } from "../seed-history";
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

describe("GET /api/company/:companyCode", () => {
  it("存在する会社コードで会社情報を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/company/1",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.companyCode).toBe(1);
    expect(body.companyName).toBeTypeOf("string");
    expect(body.formalName).toBeTypeOf("string");
  });

  it("companyCode=0でJRの情報を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/company/0",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.companyCode).toBe(0);
    expect(body.companyName).toBe("JR");
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/company/1",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("存在しない会社コードで404を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/company/9999999",
    });
    expect(res.statusCode).toBe(404);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/company/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/company", () => {
  it("全会社一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/company",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    for (const company of body) {
      expect(company).toHaveProperty("companyCode");
      expect(company).toHaveProperty("companyName");
    }
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/company",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });
});

describe("GET /api/companyRailways/:companyCode", () => {
  it("存在する会社コードで路線一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyRailways/1",
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

  it("companyCode=0でJR全路線を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyRailways/0",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyRailways/1",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyRailways/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/companyStations/:companyCode", () => {
  it("存在する会社コードで駅一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyStations/1",
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
      url: "/api/companyStations/1",
    });
    const body = res.json();
    for (const station of body) {
      expect(station.visitType).toBe(0);
    }
  });

  it("未認証の場合Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyStations/1",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("認証済みの場合visitTypeが数値で設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyStations/1",
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
      url: "/api/companyStations/1",
      headers: { cookie },
    });
    expect(res.headers["cache-control"]).toBeUndefined();
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyStations/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("同一履歴データでのユーザー分離(companyStations)", () => {
  let userACookie: string;
  let userBCookie: string;

  beforeAll(async () => {
    userACookie = await loginTestUserWithName(app, "会社分離ユーザーA");
    userBCookie = await loginTestUserWithName(app, "会社分離ユーザーB");
    await seedHistory(app, userACookie);
    await seedHistory(app, userBCookie);
  });

  it("同じ取得方法ならA/Bで同じ会社駅結果を返す", async () => {
    const [resA, resB] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/companyStations/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/companyStations/1",
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
        url: "/api/companyStations/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/companyStations/1",
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
        url: "/api/companyStations/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/companyStations/1",
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
