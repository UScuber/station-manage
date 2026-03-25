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

describe("グローバルエラーハンドラ", () => {
  it("バリデーションエラーで400とBad Requestメッセージを返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/station/abc",
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe("Bad Request");
  });

  it("InputError(存在しないリソース)で404を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/station/9999999",
    });
    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.error).toBe("record not found");
  });

  it("AuthErrorで401を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/logout",
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("存在しないルートで404を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/nonexistent",
    });
    expect(res.statusCode).toBe(404);
  });
});
