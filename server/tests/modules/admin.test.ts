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

describe("GET /api/timetableURL/:stationCode", () => {
  it("存在する駅コードで時刻表URLを返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/timetableURL/1110101",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("timetable");
    expect(body).toHaveProperty("trainPos");
    expect(Array.isArray(body.timetable)).toBe(true);
    expect(body.trainPos).toBeTypeOf("string");
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/timetableURL/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("PUT /api/timetableURL (管理者専用)", () => {
  it("未認証の場合401を返す", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/timetableURL",
      payload: {
        code: 1110101,
        direction: "up",
        mode: "update",
        url: "https://example.com",
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it("一般ユーザーの場合403を返す", async () => {
    // 一般ユーザーを作成してログイン
    await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: {
        userName: "admin-test-user",
        userEmail: "admin-test@example.com",
        password: "password1234",
      },
    });
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: { userEmail: "admin-test@example.com", password: "password1234" },
    });
    const cookie = loginRes.headers["set-cookie"] as string;

    const res = await app.inject({
      method: "PUT",
      url: "/api/timetableURL",
      headers: { cookie },
      payload: {
        code: 1110101,
        direction: "up",
        mode: "update",
        url: "https://example.com",
      },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("PUT /api/trainPosURL (管理者専用)", () => {
  it("未認証の場合401を返す", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/trainPosURL",
      payload: { code: 1110101, url: "https://example.com" },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /api/exportStationURL (管理者専用)", () => {
  it("未認証の場合401を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/exportStationURL",
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /api/importStationURL (管理者専用)", () => {
  it("未認証の場合401を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/importStationURL",
      payload: { data: [] },
    });
    expect(res.statusCode).toBe(401);
  });
});
