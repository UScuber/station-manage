import { describe, it, expect } from "vitest";
import { escapeLikePattern } from "../../src/shared/sql";

describe("escapeLikePattern", () => {
  it("% をエスケープする", () => {
    expect(escapeLikePattern("100%")).toBe("100\\%");
  });

  it("_ をエスケープする", () => {
    expect(escapeLikePattern("a_b")).toBe("a\\_b");
  });

  it("% と _ の両方をエスケープする", () => {
    expect(escapeLikePattern("%_test_%")).toBe("\\%\\_test\\_\\%");
  });

  it("特殊文字がなければそのまま返す", () => {
    expect(escapeLikePattern("函館")).toBe("函館");
  });

  it("空文字列はそのまま返す", () => {
    expect(escapeLikePattern("")).toBe("");
  });
});
