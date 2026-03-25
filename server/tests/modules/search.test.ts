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

describe("GET /api/searchStationGroupList", () => {
  it("名前なしで駅グループ一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupList?off=0&len=10",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeLessThanOrEqual(10);
    expect(body.length).toBeGreaterThan(0);
    for (const group of body) {
      expect(group).toHaveProperty("stationGroupCode");
      expect(group).toHaveProperty("stationName");
      expect(group).toHaveProperty("prefName");
    }
  });

  it("名前指定で検索結果を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupList?name=函館&off=0&len=10",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0].stationName).toBe("函館");
  });

  it("かな検索でも結果を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupList?name=はこだて&off=0&len=10",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("lenの上限を超えると400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupList?off=0&len=101",
    });
    expect(res.statusCode).toBe(400);
  });

  it("offが負の値で400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupList?off=-1&len=10",
    });
    expect(res.statusCode).toBe(400);
  });

  it("必須パラメータ不足で400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupList",
    });
    expect(res.statusCode).toBe(400);
  });

  it("該当なしで空配列を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupList?name=存在しない駅名XXXX&off=0&len=10",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });

  it("LIKEパターン特殊文字(%)を含む検索でエラーにならない", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupList?name=%25test&off=0&len=10",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("LIKEパターン特殊文字(_)を含む検索でエラーにならない", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupList?name=a_b&off=0&len=10",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("len=1(最小値)で1件だけ返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupList?off=0&len=1",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBe(1);
  });

});

describe("GET /api/searchStationGroupCount", () => {
  it("名前なしで全駅グループ数を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupCount",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toBeTypeOf("number");
    expect(body).toBeGreaterThan(0);
  });

  it("名前指定で該当件数を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupCount?name=函館",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toBeTypeOf("number");
    expect(body).toBeGreaterThan(0);
  });

  it("該当なしで0を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupCount?name=存在しない駅名XXXX",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toBe(0);
  });
});

describe("GET /api/searchNearestStationGroup", () => {
  it("座標指定で最寄り駅グループを返す", async () => {
    // 函館駅付近の座標
    const res = await app.inject({
      method: "GET",
      url: "/api/searchNearestStationGroup?lat=41.7738&lng=140.7268",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(20);
    for (const group of body) {
      expect(group).toHaveProperty("stationGroupCode");
      expect(group).toHaveProperty("stationName");
      expect(group).toHaveProperty("distance");
      expect(group.distance).toBeTypeOf("number");
    }
  });

  it("num指定で取得件数を制限できる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchNearestStationGroup?lat=41.7738&lng=140.7268&num=5",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBe(5);
  });

  it("結果がdistance昇順になっている", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchNearestStationGroup?lat=41.7738&lng=140.7268&num=10",
    });
    const body = res.json();
    for (let i = 1; i < body.length; i++) {
      expect(body[i].distance).toBeGreaterThanOrEqual(body[i - 1].distance);
    }
  });

  it("必須パラメータ不足で400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchNearestStationGroup?lat=41.7738",
    });
    expect(res.statusCode).toBe(400);
  });

  it("num=1で1件だけ返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchNearestStationGroup?lat=41.7738&lng=140.7268&num=1",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBe(1);
  });

  it("numの上限を超えると400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchNearestStationGroup?lat=41.7738&lng=140.7268&num=21",
    });
    expect(res.statusCode).toBe(400);
  });
});
