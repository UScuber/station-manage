import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp, loginTestUser, loginTestUserWithName } from "../helper";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let cookie: string;

beforeAll(async () => {
  app = createTestApp();
  await app.ready();
  cookie = await loginTestUser(app);
});

afterAll(async () => {
  await app.close();
});

const sameStationHistoryRecords = [
  { code: 1110101, date: "2025-07-01T00:00:00.000Z", state: 0 },
  { code: 1110102, date: "2025-07-02T00:00:00.000Z", state: 1 },
];

const sameGroupHistoryRecords = [
  { code: 11101010, date: "2025-07-03T00:00:00.000Z" },
];

const seedSameHistory = async (targetCookie: string) => {
  for (const record of sameStationHistoryRecords) {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie: targetCookie },
      payload: record,
    });
    expect(res.statusCode).toBe(200);
  }

  for (const record of sameGroupHistoryRecords) {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationGroupDate",
      headers: { cookie: targetCookie },
      payload: record,
    });
    expect(res.statusCode).toBe(200);
  }
};

describe("GET /api/health", () => {
  it("OKを返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/health",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("OK");
  });
});

describe("GET /api/station/:stationCode", () => {
  it("存在する駅コードで駅情報を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/station/1110101",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.stationCode).toBe(1110101);
    expect(body.stationName).toBe("函館");
    expect(body.railwayName).toBe("JR函館本線(函館－長万部)");
    expect(body.stationGroupCode).toBe(11101010);
    expect(body.prefName).toBeTypeOf("string");
    expect(body.companyCode).toBeTypeOf("number");
    expect(body.railwayCompany).toBeTypeOf("string");
    expect(body.latitude).toBeTypeOf("number");
    expect(body.longitude).toBeTypeOf("number");
  });

  it("隣接駅情報(left, right)が含まれる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/station/1110101",
    });
    const body = res.json();
    expect(body).toHaveProperty("left");
    expect(body).toHaveProperty("right");
    expect(Array.isArray(body.left)).toBe(true);
    expect(Array.isArray(body.right)).toBe(true);
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/station/1110101",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("存在しない駅コードで404を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/station/9999999",
    });
    expect(res.statusCode).toBe(404);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/station/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/stationGroup/:stationGroupCode", () => {
  it("存在するグループコードでグループ情報を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationGroup/11101010",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.stationGroupCode).toBe(11101010);
    expect(body.stationName).toBe("函館");
    expect(body.prefName).toBeTypeOf("string");
    expect(body.kana).toBeTypeOf("string");
  });

  it("Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationGroup/11101010",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("存在しないグループコードで404を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationGroup/9999999",
    });
    expect(res.statusCode).toBe(404);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationGroup/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/stationsByGroupCode/:stationGroupCode", () => {
  it("存在するグループコードで駅一覧を返す", async () => {
    // stationGroupCode=11101010 は函館駅で、JR函館本線と道南いさりび鉄道線の2駅
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/11101010",
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
    for (const station of body) {
      expect(station.stationGroupCode).toBe(11101010);
      expect(station.stationName).toBe("函館");
      expect(station).toHaveProperty("railwayName");
      expect(station).toHaveProperty("left");
      expect(station).toHaveProperty("right");
    }
  });

  it("未認証の場合visitTypeが全てNone(0)になる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/11101010",
    });
    const body = res.json();
    for (const station of body) {
      expect(station.visitType).toBe(0);
    }
  });

  it("未認証の場合Cache-Controlヘッダーが設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/11101010",
    });
    expect(res.headers["cache-control"]).toBe(
      "max-age=604800, stale-while-revalidate=604800, stale-if-error=604800",
    );
  });

  it("認証済みの場合visitTypeが数値で設定される", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/11101010",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    for (const station of body) {
      expect(station).toHaveProperty("visitType");
      expect(station.visitType).toBeTypeOf("number");
    }
  });

  it("認証済みの場合Cache-Controlヘッダーが設定されない", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/11101010",
      headers: { cookie },
    });
    expect(res.headers["cache-control"]).toBeUndefined();
  });

  it("存在しないグループコードで404を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/9999999",
    });
    expect(res.statusCode).toBe(404);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationsByGroupCode/abc",
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("同一履歴データでのユーザー分離(stationsByGroupCode)", () => {
  let userACookie: string;
  let userBCookie: string;

  beforeAll(async () => {
    userACookie = await loginTestUserWithName(app, "駅グループ分離ユーザーA");
    userBCookie = await loginTestUserWithName(app, "駅グループ分離ユーザーB");
    await seedSameHistory(userACookie);
    await seedSameHistory(userBCookie);
  });

  it("同じ取得方法ならA/Bで同じ駅グループ結果を返す", async () => {
    const [resA, resB] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/stationsByGroupCode/11101010",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/stationsByGroupCode/11101010",
        headers: { cookie: userBCookie },
      }),
    ]);

    expect(resA.statusCode).toBe(200);
    expect(resB.statusCode).toBe(200);
    expect(resA.json()).toEqual(resB.json());
  });

  it("Aだけ履歴を削除すると同じ取得方法でvisitTypeに差が出る", async () => {
    const [beforeA, beforeB] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/stationsByGroupCode/11101010",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/stationsByGroupCode/11101010",
        headers: { cookie: userBCookie },
      }),
    ]);

    const beforeBodyA = beforeA.json() as {
      stationCode: number;
      visitType: number;
    }[];
    const targetStationCode =
      beforeBodyA.find((s) => s.visitType === 0)?.stationCode ??
      beforeBodyA[0].stationCode;

    const addRes = await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie: userACookie },
      payload: {
        code: targetStationCode,
        date: "2025-07-08T00:00:00.000Z",
        state: 0,
      },
    });
    expect(addRes.statusCode).toBe(200);

    const [resA, resB] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/stationsByGroupCode/11101010",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/stationsByGroupCode/11101010",
        headers: { cookie: userBCookie },
      }),
    ]);
    expect(resA.statusCode).toBe(200);
    expect(resB.statusCode).toBe(200);

    const stationA = resA
      .json()
      .find(
        (s: { stationCode: number }) => s.stationCode === targetStationCode,
      );
    const stationB = resB
      .json()
      .find(
        (s: { stationCode: number }) => s.stationCode === targetStationCode,
      );
    expect(stationA).toBeDefined();
    expect(stationB).toBeDefined();
    expect(stationA.visitType).not.toBe(stationB.visitType);
  });
});
