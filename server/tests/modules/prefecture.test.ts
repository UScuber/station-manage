import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp } from "../helper";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeAll(async () => {
  app = createTestApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

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

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefStations/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});
