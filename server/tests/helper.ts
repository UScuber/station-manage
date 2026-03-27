import crypto from "crypto";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app";

export function createTestApp() {
  return buildApp({ logger: false, rateLimit: false });
}

function randomEmail(): string {
  return `test-${crypto.randomBytes(8).toString("hex")}@example.com`;
}

export function extractSessionCookie(
  setCookieHeader: string | string[] | undefined,
): string {
  if (!setCookieHeader) {
    throw new Error("set-cookie header is missing");
  }

  const headers = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  for (const header of headers) {
    const cookiePair = header.split(";")[0]?.trim();
    if (cookiePair?.startsWith("sessionId=")) {
      return cookiePair;
    }
  }

  throw new Error("sessionId cookie is missing");
}

/** 指定名のテスト用ユーザーを登録してセッションCookieを返す */
export async function loginTestUserWithName(
  app: FastifyInstance,
  userName: string,
): Promise<string> {
  const user = {
    userName,
    userEmail: randomEmail(),
    password: "password1234",
  };
  await app.inject({
    method: "POST",
    url: "/api/signup",
    payload: user,
  });
  const loginRes = await app.inject({
    method: "POST",
    url: "/api/login",
    payload: { userEmail: user.userEmail, password: user.password },
  });
  return extractSessionCookie(loginRes.headers["set-cookie"]);
}

/** テスト用ユーザーを登録してセッションCookieを返す */
export async function loginTestUser(app: FastifyInstance): Promise<string> {
  return loginTestUserWithName(app, "テストユーザー");
}

/** テスト用管理者ユーザーを登録してセッションCookieを返す */
export async function loginAdminUser(app: FastifyInstance): Promise<string> {
  const user = {
    userName: "管理者ユーザー",
    userEmail: randomEmail(),
    password: "password1234",
  };
  await app.inject({
    method: "POST",
    url: "/api/signup",
    payload: user,
  });
  // DBのroleを直接adminに更新（遅延importでDB接続の競合を回避）
  const { db } = await import("../src/db/connection");
  db.prepare("UPDATE Users SET role = 1 WHERE userEmail = ?").run(
    user.userEmail,
  );
  const loginRes = await app.inject({
    method: "POST",
    url: "/api/login",
    payload: { userEmail: user.userEmail, password: user.password },
  });
  return extractSessionCookie(loginRes.headers["set-cookie"]);
}
