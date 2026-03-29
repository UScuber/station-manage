import crypto from "crypto";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp, loginAdminUser, extractSessionCookie } from "../helper";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeAll(async () => {
  app = createTestApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const randomEmail = () =>
  `user-test-${crypto.randomBytes(8).toString("hex")}@example.com`;

describe("POST /api/signup", () => {
  it("新規ユーザーを登録できる", async () => {
    const email = randomEmail();
    const res = await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: {
        userName: "テストユーザー",
        userEmail: email,
        password: "password1234",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.auth).toBe(true);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("同じメールアドレスで登録するとauth=falseを返す", async () => {
    const email = randomEmail();
    // 1回目: 登録
    await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: {
        userName: "テスト",
        userEmail: email,
        password: "password1234",
      },
    });
    // 2回目: 重複
    const res = await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: {
        userName: "テスト",
        userEmail: email,
        password: "password1234",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.auth).toBe(false);
  });

  it("userNameが空で400を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: {
        userName: "",
        userEmail: randomEmail(),
        password: "password1234",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("メールアドレスの形式が不正で400を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: {
        userName: "test",
        userEmail: "invalid",
        password: "password1234",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("パスワードが短すぎると400を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: {
        userName: "test",
        userEmail: randomEmail(),
        password: "short",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("必須フィールド不足で400を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/login", () => {
  const loginUser = {
    userName: "ログインテスト",
    userEmail: randomEmail(),
    password: "password1234",
  };

  beforeAll(async () => {
    await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: loginUser,
    });
  });

  it("正しい認証情報でログインできる", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: { userEmail: loginUser.userEmail, password: loginUser.password },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.auth).toBe(true);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("間違ったパスワードで401を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: { userEmail: loginUser.userEmail, password: "wrongpassword" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("存在しないメールアドレスで401を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: {
        userEmail: "nonexistent@example.com",
        password: "password1234",
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it("不正なメールアドレス形式で400を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: { userEmail: "invalid", password: "password1234" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/status", () => {
  const statusUser = {
    userName: "ステータステスト",
    userEmail: randomEmail(),
    password: "password1234",
  };

  beforeAll(async () => {
    await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: statusUser,
    });
  });

  it("未認証の場合auth=falseを返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/status",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.auth).toBe(false);
    expect(body.userEmail).toBeNull();
    expect(body.userName).toBeNull();
    expect(body.isAdmin).toBe(false);
  });

  it("認証済みの場合ユーザー情報を返す", async () => {
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: {
        userEmail: statusUser.userEmail,
        password: statusUser.password,
      },
    });
    const cookie = extractSessionCookie(loginRes.headers["set-cookie"]);
    expect(cookie).toContain("sessionId=");

    const res = await app.inject({
      method: "GET",
      url: "/api/status",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.auth).toBe(true);
    expect(body.userEmail).toBe(statusUser.userEmail);
    expect(body.userName).toBe(statusUser.userName);
    expect(body.isAdmin).toBe(false);
  });

  it("無効なセッションIDでauth=falseを返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/status",
      headers: { cookie: "sessionId=invalidsessionid" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.auth).toBe(false);
  });
});

describe("POST /api/logout", () => {
  const logoutUser = {
    userName: "ログアウトテスト",
    userEmail: randomEmail(),
    password: "password1234",
  };

  beforeAll(async () => {
    await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: logoutUser,
    });
  });

  it("認証済みの場合ログアウトできる", async () => {
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: {
        userEmail: logoutUser.userEmail,
        password: logoutUser.password,
      },
    });
    const cookie = extractSessionCookie(loginRes.headers["set-cookie"]);

    const res = await app.inject({
      method: "POST",
      url: "/api/logout",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);

    const statusRes = await app.inject({
      method: "GET",
      url: "/api/status",
      headers: { cookie },
    });
    const body = statusRes.json();
    expect(body.auth).toBe(false);
  });

  it("未認証の場合401を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/logout",
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/status (管理者ユーザー)", () => {
  it("管理者ユーザーの場合isAdmin=trueを返す", async () => {
    const adminCookie = await loginAdminUser(app);
    const res = await app.inject({
      method: "GET",
      url: "/api/status",
      headers: { cookie: adminCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.auth).toBe(true);
    expect(body.isAdmin).toBe(true);
  });
});

describe("セッション管理", () => {
  it("ログアウト後のセッションCookieでは認証できない", async () => {
    const email = randomEmail();
    await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: {
        userName: "セッションテスト",
        userEmail: email,
        password: "password1234",
      },
    });
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: { userEmail: email, password: "password1234" },
    });
    const sessionCookie = extractSessionCookie(loginRes.headers["set-cookie"]);

    // ログアウト
    await app.inject({
      method: "POST",
      url: "/api/logout",
      headers: { cookie: sessionCookie },
    });

    // ログアウト後のセッションで認証を試みる
    const statusRes = await app.inject({
      method: "GET",
      url: "/api/status",
      headers: { cookie: sessionCookie },
    });
    expect(statusRes.json().auth).toBe(false);
  });

  it("同一ユーザーで複数回ログインできる", async () => {
    const email = randomEmail();
    await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: {
        userName: "複数セッション",
        userEmail: email,
        password: "password1234",
      },
    });

    const login1 = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: { userEmail: email, password: "password1234" },
    });
    const login2 = await app.inject({
      method: "POST",
      url: "/api/login",
      payload: { userEmail: email, password: "password1234" },
    });
    const cookie1 = extractSessionCookie(login1.headers["set-cookie"]);
    const cookie2 = extractSessionCookie(login2.headers["set-cookie"]);

    // 両方のセッションが有効
    const status1 = await app.inject({
      method: "GET",
      url: "/api/status",
      headers: { cookie: cookie1 },
    });
    const status2 = await app.inject({
      method: "GET",
      url: "/api/status",
      headers: { cookie: cookie2 },
    });
    expect(status1.json().auth).toBe(true);
    expect(status2.json().auth).toBe(true);

    // 片方をログアウトしてももう片方は有効
    await app.inject({
      method: "POST",
      url: "/api/logout",
      headers: { cookie: cookie1 },
    });
    const statusAfter = await app.inject({
      method: "GET",
      url: "/api/status",
      headers: { cookie: cookie2 },
    });
    expect(statusAfter.json().auth).toBe(true);
  });

  it("signup時にセッションCookieが発行される", async () => {
    const email = randomEmail();
    const res = await app.inject({
      method: "POST",
      url: "/api/signup",
      payload: {
        userName: "Cookieテスト",
        userEmail: email,
        password: "password1234",
      },
    });
    const setCookieHeader = res.headers["set-cookie"];
    const setCookie = Array.isArray(setCookieHeader)
      ? setCookieHeader[0]
      : (setCookieHeader ?? "");
    expect(setCookie).toContain("sessionId=");
    expect(setCookie).toContain("HttpOnly");
  });
});
