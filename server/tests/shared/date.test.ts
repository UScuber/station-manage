import { describe, it, expect } from "vitest";
import { convert_date } from "../../src/shared/date";
import { InvalidValueError } from "../../src/shared/errors";

describe("convert_date", () => {
  it("ISO文字列を変換できる", () => {
    const result = convert_date("2025-01-15T12:30:00.000Z");
    // タイムゾーンによって結果が変わるため、フォーマットのみ検証
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it("Dateオブジェクトを変換できる", () => {
    const result = convert_date(new Date("2025-01-15T12:30:00.000Z"));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it("不正な日付文字列でInvalidValueErrorを投げる", () => {
    expect(() => convert_date("invalid-date")).toThrow(InvalidValueError);
  });

  it("空文字列でInvalidValueErrorを投げる", () => {
    expect(() => convert_date("")).toThrow(InvalidValueError);
  });
});
