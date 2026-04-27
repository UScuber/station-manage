import { describe, it, expect } from "vitest";
import { convertDate } from "../../src/shared/date";
import { InvalidValueError } from "../../src/shared/errors";

describe("convertDate", () => {
  it("ISO文字列を変換できる", () => {
    const result = convertDate("2025-01-15T12:30:00.000Z");
    // タイムゾーンによって結果が変わるため、フォーマットのみ検証
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it("Dateオブジェクトを変換できる", () => {
    const result = convertDate(new Date("2025-01-15T12:30:00.000Z"));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it("タイムスタンプ(number)を変換できる", () => {
    const result = convertDate(1736937000000);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it("不正な日付文字列でInvalidValueErrorを投げる", () => {
    expect(() => convertDate("invalid-date")).toThrow(InvalidValueError);
  });

  it("空文字列でInvalidValueErrorを投げる", () => {
    expect(() => convertDate("")).toThrow(InvalidValueError);
  });
});
