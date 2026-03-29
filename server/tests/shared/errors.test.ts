import { describe, it, expect } from "vitest";
import {
  InputError,
  InvalidValueError,
  AuthError,
  ForbiddenError,
  ServerError,
} from "../../src/shared/errors";

describe("カスタムエラー", () => {
  it("InputError の statusCode は 404", () => {
    const err = new InputError("not found");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("not found");
    expect(err).toBeInstanceOf(Error);
  });

  it("InvalidValueError の statusCode は 400", () => {
    const err = new InvalidValueError("bad value");
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe("bad value");
  });

  it("AuthError の statusCode は 401", () => {
    const err = new AuthError("unauthorized");
    expect(err.statusCode).toBe(401);
  });

  it("ForbiddenError の statusCode は 403", () => {
    const err = new ForbiddenError("forbidden");
    expect(err.statusCode).toBe(403);
  });

  it("ServerError の statusCode は 500", () => {
    const err = new ServerError("internal error");
    expect(err.statusCode).toBe(500);
  });

  it("name がクラス名と一致する", () => {
    expect(new InputError().name).toBe("InputError");
    expect(new AuthError().name).toBe("AuthError");
  });

  it("スタックトレースを持つ", () => {
    const err = new InputError("test");
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain("InputError");
  });
});
