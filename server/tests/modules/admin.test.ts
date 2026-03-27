import crypto from "crypto";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp, extractSessionCookie } from "../helper";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

const randomEmail = () =>
  `admin-test-${crypto.randomBytes(8).toString("hex")}@example.com`;

/** テスト内で管理者Cookieを作る */
async function createAdminCookie(): Promise<string> {
  const email = randomEmail();
  await app.inject({
    method: "POST",
    url: "/api/signup",
    payload: { userName: "管理者", userEmail: email, password: "password1234" },
  });
  const { db } = await import("../../src/db/connection");
  db.prepare("UPDATE Users SET role = 1 WHERE userEmail = ?").run(email);
  const loginRes = await app.inject({
    method: "POST",
    url: "/api/login",
    payload: { userEmail: email, password: "password1234" },
  });
  return extractSessionCookie(loginRes.headers["set-cookie"]);
}

/** テスト内で一般ユーザーCookieを作る */
async function createUserCookie(): Promise<string> {
  const email = randomEmail();
  await app.inject({
    method: "POST",
    url: "/api/signup",
    payload: { userName: "一般ユーザー", userEmail: email, password: "password1234" },
  });
  const loginRes = await app.inject({
    method: "POST",
    url: "/api/login",
    payload: { userEmail: email, password: "password1234" },
  });
  return extractSessionCookie(loginRes.headers["set-cookie"]);
}

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
    const cookie = await createUserCookie();
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

  it("管理者で時刻表URLを更新できる", async () => {
    const cookie = await createAdminCookie();
    const res = await app.inject({
      method: "PUT",
      url: "/api/timetableURL",
      headers: { cookie },
      payload: {
        code: 1110101,
        direction: "up",
        mode: "update",
        url: "https://example.com/timetable",
      },
    });
    expect(res.statusCode).toBe(200);

    // 更新されたことを確認
    const getRes = await app.inject({
      method: "GET",
      url: "/api/timetableURL/1110101",
    });
    const body = getRes.json();
    expect(body.timetable).toContainEqual(
      expect.objectContaining({ url: "https://example.com/timetable" }),
    );
  });

  it("管理者で時刻表URLを削除できる", async () => {
    const cookie = await createAdminCookie();
    // まず追加
    await app.inject({
      method: "PUT",
      url: "/api/timetableURL",
      headers: { cookie },
      payload: {
        code: 1110101,
        direction: "down",
        mode: "update",
        url: "https://example.com/to-delete",
      },
    });

    // 削除
    const res = await app.inject({
      method: "PUT",
      url: "/api/timetableURL",
      headers: { cookie },
      payload: {
        code: 1110101,
        direction: "down",
        mode: "delete",
      },
    });
    expect(res.statusCode).toBe(200);
  });

  it("mode=updateでurlなしの場合400を返す", async () => {
    const cookie = await createAdminCookie();
    const res = await app.inject({
      method: "PUT",
      url: "/api/timetableURL",
      headers: { cookie },
      payload: {
        code: 1110101,
        direction: "up",
        mode: "update",
      },
    });
    expect(res.statusCode).toBe(400);
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

  it("一般ユーザーの場合403を返す", async () => {
    const cookie = await createUserCookie();
    const res = await app.inject({
      method: "PUT",
      url: "/api/trainPosURL",
      headers: { cookie },
      payload: { code: 1110101, url: "https://example.com/trainpos" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("管理者で列車走行位置URLを更新できる", async () => {
    const cookie = await createAdminCookie();
    const res = await app.inject({
      method: "PUT",
      url: "/api/trainPosURL",
      headers: { cookie },
      payload: { code: 1110101, url: "https://example.com/trainpos" },
    });
    expect(res.statusCode).toBe(200);

    // 更新されたことを確認
    const getRes = await app.inject({
      method: "GET",
      url: "/api/timetableURL/1110101",
    });
    const body = getRes.json();
    expect(body.trainPos).toBe("https://example.com/trainpos");
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

  it("一般ユーザーの場合403を返す", async () => {
    const cookie = await createUserCookie();
    const res = await app.inject({
      method: "POST",
      url: "/api/exportStationURL",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it("管理者でエクスポートできる", async () => {
    const cookie = await createAdminCookie();
    const res = await app.inject({
      method: "POST",
      url: "/api/exportStationURL",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty("stationCode");
    expect(body.data[0]).toHaveProperty("timetable");
    expect(body.data[0]).toHaveProperty("trainPosURL");
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

  it("一般ユーザーの場合403を返す", async () => {
    const cookie = await createUserCookie();
    const res = await app.inject({
      method: "POST",
      url: "/api/importStationURL",
      headers: { cookie },
      payload: { data: [] },
    });
    expect(res.statusCode).toBe(403);
  });

  it("管理者で空データをインポートできる", async () => {
    const cookie = await createAdminCookie();
    const res = await app.inject({
      method: "POST",
      url: "/api/importStationURL",
      headers: { cookie },
      payload: { data: [] },
    });
    expect(res.statusCode).toBe(200);
  });

  it("管理者でURL付きデータをインポートできる", async () => {
    const cookie = await createAdminCookie();
    const res = await app.inject({
      method: "POST",
      url: "/api/importStationURL",
      headers: { cookie },
      payload: {
        data: [
          {
            stationCode: 1110101,
            timetable: [{ direction: "up", url: "https://example.com/imported" }],
            trainPosURL: "https://example.com/imported-pos",
          },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
  });
});
