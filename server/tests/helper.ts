import crypto from "crypto";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../app";

export function createTestApp() {
  return buildApp({ logger: false, rateLimit: false });
}

function randomEmail(): string {
  return `test-${crypto.randomBytes(8).toString("hex")}@example.com`;
}

/** テスト用ユーザーを登録してセッションCookieを返す */
export async function loginTestUser(app: FastifyInstance): Promise<string> {
  const user = {
    userName: "テストユーザー",
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
  return loginRes.headers["set-cookie"] as string;
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
  db.prepare("UPDATE Users SET role = 1 WHERE userEmail = ?").run(user.userEmail);
  const loginRes = await app.inject({
    method: "POST",
    url: "/api/login",
    payload: { userEmail: user.userEmail, password: user.password },
  });
  return loginRes.headers["set-cookie"] as string;
}
