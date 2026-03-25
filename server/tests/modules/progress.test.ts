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

// --- 未認証テスト ---

describe("認証必須エンドポイント", () => {
  const endpoints = [
    { method: "GET" as const, url: "/api/railwayProgress/11101" },
    { method: "GET" as const, url: "/api/railwayProgressList/1" },
    { method: "GET" as const, url: "/api/prefRailwayProgressList/1" },
    { method: "GET" as const, url: "/api/railwayProgressList" },
    { method: "GET" as const, url: "/api/companyProgress/1" },
    { method: "GET" as const, url: "/api/companyProgress" },
    { method: "GET" as const, url: "/api/prefProgress/1" },
    { method: "GET" as const, url: "/api/prefProgress" },
  ];

  for (const { method, url } of endpoints) {
    it(`${method} ${url} は未認証で401を返す`, async () => {
      const res = await app.inject({ method, url });
      expect(res.statusCode).toBe(401);
    });
  }
});

// --- 認証済みテスト ---

describe("GET /api/railwayProgress/:railwayCode", () => {
  it("認証済みで路線進捗を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayProgress/11101",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayProgress/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/railwayProgressList/:companyCode", () => {
  it("認証済みで会社別路線進捗一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayProgressList/1",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayProgressList/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/prefRailwayProgressList/:prefCode", () => {
  it("認証済みで都道府県別路線進捗一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefRailwayProgressList/1",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefRailwayProgressList/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/railwayProgressList", () => {
  it("認証済みで全路線進捗一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayProgressList",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("GET /api/companyProgress/:companyCode", () => {
  it("認証済みで会社進捗を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyProgress/1",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyProgress/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/companyProgress", () => {
  it("認証済みで全会社進捗一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyProgress",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("GET /api/prefProgress/:prefCode", () => {
  it("認証済みで都道府県進捗を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefProgress/1",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefProgress/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/prefProgress", () => {
  it("認証済みで全都道府県進捗一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefProgress",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
