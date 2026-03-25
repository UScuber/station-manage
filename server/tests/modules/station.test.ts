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

describe("GET /api/health", () => {
  it("OKを返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/health",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("OK");
  });
});

describe("GET /api/station/:stationCode", () => {
  it("存在する駅コードで駅情報を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/station/1110101",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.stationCode).toBe(1110101);
    expect(body.stationName).toBe("函館");
    expect(body.railwayName).toBe("JR函館本線(函館－長万部)");
    expect(body.stationGroupCode).toBe(11101010);
    expect(body.prefName).toBeTypeOf("string");
    expect(body.companyCode).toBeTypeOf("number");
    expect(body.railwayCompany).toBeTypeOf("string");
    expect(body.latitude).toBeTypeOf("number");
    expect(body.longitude).toBeTypeOf("number");
  });

  it("隣接駅情報(left, right)が含まれる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/station/1110101",
    });
    const body = res.json();
    expect(body).toHaveProperty("left");
    expect(body).toHaveProperty("right");
    expect(Array.isArray(body.left)).toBe(true);
    expect(Array.isArray(body.right)).toBe(true);
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/station/1110101",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("存在しない駅コードで404を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/station/9999999",
    });
    expect(res.statusCode).toBe(404);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/station/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/stationGroup/:stationGroupCode", () => {
  it("存在するグループコードでグループ情報を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationGroup/11101010",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.stationGroupCode).toBe(11101010);
    expect(body.stationName).toBe("函館");
    expect(body.prefName).toBeTypeOf("string");
    expect(body.kana).toBeTypeOf("string");
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationGroup/11101010",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("存在しないグループコードで404を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationGroup/9999999",
    });
    expect(res.statusCode).toBe(404);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationGroup/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/stationsByGroupCode/:stationGroupCode", () => {
  it("存在するグループコードで駅一覧を返す", async () => {
    // stationGroupCode=11101010 は函館駅で、JR函館本線と道南いさりび鉄道線の2駅
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/11101010",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
    for (const station of body) {
      expect(station.stationGroupCode).toBe(11101010);
      expect(station.stationName).toBe("函館");
      expect(station).toHaveProperty("railwayName");
      expect(station).toHaveProperty("left");
      expect(station).toHaveProperty("right");
    }
  });

  it("未認証の場合visitTypeが全てNone(0)になる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/11101010",
    });
    const body = res.json();
    for (const station of body) {
      expect(station.visitType).toBe(0);
    }
  });

  it("未認証の場合Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/11101010",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("認証済みの場合visitTypeが数値で設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/11101010",
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
      url: "/api/stationsByGroupCode/11101010",
      headers: { cookie },
    });
    expect(res.headers["cache-control"]).toBeUndefined();
  });

  it("存在しないグループコードで404を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/9999999",
    });
    expect(res.statusCode).toBe(404);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});
