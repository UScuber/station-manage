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

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyStations/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});
