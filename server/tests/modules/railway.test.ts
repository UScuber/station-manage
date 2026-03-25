import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp, loginTestUser } from "../helper";
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

describe("GET /api/railway/:railwayCode", () => {
  it("存在する路線コードで路線情報を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railway/11101",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.railwayCode).toBe(11101);
    expect(body.railwayName).toBeTypeOf("string");
    expect(body.companyName).toBeTypeOf("string");
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railway/11101",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("存在しない路線コードで404を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railway/9999999",
    });
    expect(res.statusCode).toBe(404);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railway/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/railway", () => {
  it("全路線一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railway",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    for (const railway of body) {
      expect(railway).toHaveProperty("railwayCode");
      expect(railway).toHaveProperty("railwayName");
      expect(railway).toHaveProperty("companyName");
    }
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railway",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });
});

describe("GET /api/railwayStations/:railwayCode", () => {
  it("存在する路線コードで駅一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayStations/11101",
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
      url: "/api/railwayStations/11101",
    });
    const body = res.json();
    for (const station of body) {
      expect(station.visitType).toBe(0);
    }
  });

  it("未認証の場合Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayStations/11101",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("認証済みの場合visitTypeが数値で設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayStations/11101",
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
      url: "/api/railwayStations/11101",
      headers: { cookie },
    });
    expect(res.headers["cache-control"]).toBeUndefined();
  });

  it("存在しない路線コードで404を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayStations/9999999",
    });
    expect(res.statusCode).toBe(404);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayStations/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});
