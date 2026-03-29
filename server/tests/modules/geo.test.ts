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

describe("GET /api/railpaths/:railwayCode", () => {
  it("存在する路線コードでGeoJSONを返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railpaths/11101",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.type).toBe("Feature");
    expect(body.geometry.type).toBe("MultiLineString");
    expect(Array.isArray(body.geometry.coordinates)).toBe(true);
    expect(body.properties).toHaveProperty("railwayCode");
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railpaths/11101",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("存在しない路線コードで404を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railpaths/9999999",
    });
    expect(res.statusCode).toBe(404);
  });

  it("GeoJSONの座標がMultiLineString形式で数値配列になっている", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railpaths/11101",
    });
    const body = res.json();
    const coords = body.geometry.coordinates;
    expect(coords.length).toBeGreaterThan(0);
    // MultiLineString: [[lng, lat], ...][]
    for (const line of coords) {
      expect(Array.isArray(line)).toBe(true);
      expect(line.length).toBeGreaterThan(0);
      for (const point of line) {
        expect(Array.isArray(point)).toBe(true);
        expect(point.length).toBeGreaterThanOrEqual(2);
        expect(point[0]).toBeTypeOf("number"); // lng
        expect(point[1]).toBeTypeOf("number"); // lat
      }
    }
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railpaths/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/pathslist/:companyCode", () => {
  it("存在する会社コードでGeoJSON配列を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/pathslist/1",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    for (const feature of body) {
      expect(feature.type).toBe("Feature");
      expect(feature.geometry.type).toBe("MultiLineString");
    }
  });

  it("存在しない会社コードで空配列を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/pathslist/9999999",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });

  it("companyCode=0でJR全路線のGeoJSONを返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/pathslist/0",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/pathslist/1",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/pathslist/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/allRailPaths", () => {
  it("全路線のGeoJSON配列を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/allRailPaths",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    for (const feature of body) {
      expect(feature.type).toBe("Feature");
      expect(feature.geometry.type).toBe("MultiLineString");
    }
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/allRailPaths",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });
});
