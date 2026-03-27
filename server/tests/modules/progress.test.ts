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

// --- 未認証テスト ---

describe("認証必須エンドポイント", () => {
  const endpoints = [
    { method: "GET" as const, url: "/api/railwayProgress/11101" },
    { method: "GET" as const, url: "/api/railwayProgressList/1" },
    { method: "GET" as const, url: "/api/prefRailwayProgressList/1" },
    { method: "GET" as const, url: "/api/railwayProgressList" },
    { method: "GET" as const, url: "/api/companyProgress/1" },
    { method: "GET" as const, url: "/api/companyProgress" },
    { method: "GET" as const, url: "/api/prefProgress/1" },
    { method: "GET" as const, url: "/api/prefProgress" },
  ];

  for (const { method, url } of endpoints) {
    it(`${method} ${url} は未認証で401を返す`, async () => {
      const res = await app.inject({ method, url });
      expect(res.statusCode).toBe(401);
    });
  }
});

describe("同一履歴データでのユーザー分離(progress)", () => {
  let userACookie: string;
  let userBCookie: string;

  beforeAll(async () => {
    userACookie = await loginTestUserWithName(app, "進捗分離ユーザーA");
    userBCookie = await loginTestUserWithName(app, "進捗分離ユーザーB");
    await seedSameHistory(userACookie);
    await seedSameHistory(userBCookie);
  });

  it("同じ取得方法ならA/Bで同じ進捗を返す", async () => {
    const [railA, railB, companyA, companyB, prefA, prefB] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/railwayProgress/11101",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/railwayProgress/11101",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/companyProgress/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/companyProgress/1",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefProgress/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefProgress/1",
        headers: { cookie: userBCookie },
      }),
    ]);

    expect(railA.statusCode).toBe(200);
    expect(railB.statusCode).toBe(200);
    expect(companyA.statusCode).toBe(200);
    expect(companyB.statusCode).toBe(200);
    expect(prefA.statusCode).toBe(200);
    expect(prefB.statusCode).toBe(200);

    expect(railA.json()).toEqual(railB.json());
    expect(companyA.json()).toEqual(companyB.json());
    expect(prefA.json()).toEqual(prefB.json());
  });

  it("同じ取得方法なら一覧系進捗APIでもA/B同一", async () => {
    const [
      railListByCompanyA,
      railListByCompanyB,
      railListByPrefA,
      railListByPrefB,
      railListAllA,
      railListAllB,
      companyListA,
      companyListB,
      prefListA,
      prefListB,
    ] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/railwayProgressList/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/railwayProgressList/1",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefRailwayProgressList/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefRailwayProgressList/1",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/railwayProgressList",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/railwayProgressList",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/companyProgress",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/companyProgress",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefProgress",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefProgress",
        headers: { cookie: userBCookie },
      }),
    ]);

    expect(railListByCompanyA.statusCode).toBe(200);
    expect(railListByCompanyB.statusCode).toBe(200);
    expect(railListByPrefA.statusCode).toBe(200);
    expect(railListByPrefB.statusCode).toBe(200);
    expect(railListAllA.statusCode).toBe(200);
    expect(railListAllB.statusCode).toBe(200);
    expect(companyListA.statusCode).toBe(200);
    expect(companyListB.statusCode).toBe(200);
    expect(prefListA.statusCode).toBe(200);
    expect(prefListB.statusCode).toBe(200);

    expect(railListByCompanyA.json()).toEqual(railListByCompanyB.json());
    expect(railListByPrefA.json()).toEqual(railListByPrefB.json());
    expect(railListAllA.json()).toEqual(railListAllB.json());
    expect(companyListA.json()).toEqual(companyListB.json());
    expect(prefListA.json()).toEqual(prefListB.json());
  });

  it("Aだけ履歴を追加すると同じ取得方法でAの進捗だけ増える", async () => {
    const addRes = await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie: userACookie },
      payload: { code: 1110103, date: "2025-07-04T00:00:00.000Z", state: 0 },
    });
    expect(addRes.statusCode).toBe(200);

    const [railA, railB] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/railwayProgress/11101",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/railwayProgress/11101",
        headers: { cookie: userBCookie },
      }),
    ]);

    expect(railA.statusCode).toBe(200);
    expect(railB.statusCode).toBe(200);

    const bodyA = railA.json();
    const bodyB = railB.json();
    expect(bodyA.stationNum).toBe(bodyB.stationNum);
    expect(bodyA.getOrPassStationNum).toBeGreaterThan(
      bodyB.getOrPassStationNum,
    );
  });

  it("Aだけ履歴を追加した後は他の進捗APIでもA/Bで差が出る", async () => {
    const [
      railByCompanyA,
      railByCompanyB,
      railByPrefA,
      railByPrefB,
      railAllA,
      railAllB,
      companyA,
      companyB,
      prefA,
      prefB,
    ] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/railwayProgressList/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/railwayProgressList/1",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefRailwayProgressList/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefRailwayProgressList/1",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/railwayProgressList",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/railwayProgressList",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/companyProgress/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/companyProgress/1",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefProgress/1",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/prefProgress/1",
        headers: { cookie: userBCookie },
      }),
    ]);

    expect(railByCompanyA.statusCode).toBe(200);
    expect(railByCompanyB.statusCode).toBe(200);
    expect(railByPrefA.statusCode).toBe(200);
    expect(railByPrefB.statusCode).toBe(200);
    expect(railAllA.statusCode).toBe(200);
    expect(railAllB.statusCode).toBe(200);
    expect(companyA.statusCode).toBe(200);
    expect(companyB.statusCode).toBe(200);
    expect(prefA.statusCode).toBe(200);
    expect(prefB.statusCode).toBe(200);

    expect(railByCompanyA.json()).not.toEqual(railByCompanyB.json());
    expect(railByPrefA.json()).not.toEqual(railByPrefB.json());
    expect(railAllA.json()).not.toEqual(railAllB.json());

    expect(companyA.json().stationNum).toBe(companyB.json().stationNum);
    expect(companyA.json().getOrPassStationNum).toBeGreaterThan(
      companyB.json().getOrPassStationNum,
    );

    expect(prefA.json().stationNum).toBe(prefB.json().stationNum);
    expect(prefA.json().getOrPassStationNum).toBeGreaterThan(
      prefB.json().getOrPassStationNum,
    );
  });
});

// --- 認証済みテスト ---

describe("GET /api/railwayProgress/:railwayCode", () => {
  it("認証済みで路線進捗を返す(stationNumとgetOrPassStationNumが含まれる)", async () => {
    // 先に履歴を登録しておく
    await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie },
      payload: { code: 1110101, date: "2025-01-15T12:00:00.000Z", state: 0 },
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/railwayProgress/11101",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("stationNum");
    expect(body).toHaveProperty("getOrPassStationNum");
    expect(body.stationNum).toBeTypeOf("number");
    expect(body.stationNum).toBeGreaterThan(0);
    expect(body.getOrPassStationNum).toBeTypeOf("number");
    expect(body.getOrPassStationNum).toBeGreaterThanOrEqual(1);
    expect(body.getOrPassStationNum).toBeLessThanOrEqual(body.stationNum);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayProgress/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/railwayProgressList/:companyCode", () => {
  it("認証済みで会社別路線進捗一覧を返す(各要素にstationNumとgetOrPassStationNum)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayProgressList/1",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    for (const item of body) {
      expect(item).toHaveProperty("stationNum");
      expect(item).toHaveProperty("getOrPassStationNum");
      expect(item.stationNum).toBeGreaterThan(0);
      expect(item.getOrPassStationNum).toBeGreaterThanOrEqual(0);
      expect(item.getOrPassStationNum).toBeLessThanOrEqual(item.stationNum);
    }
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayProgressList/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/prefRailwayProgressList/:prefCode", () => {
  it("認証済みで都道府県別路線進捗一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefRailwayProgressList/1",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefRailwayProgressList/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/railwayProgressList", () => {
  it("認証済みで全路線進捗一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayProgressList",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("GET /api/companyProgress/:companyCode", () => {
  it("認証済みで会社進捗を返す(stationNumとgetOrPassStationNumが含まれる)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyProgress/1",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("stationNum");
    expect(body).toHaveProperty("getOrPassStationNum");
    expect(body.stationNum).toBeGreaterThan(0);
    expect(body.getOrPassStationNum).toBeGreaterThanOrEqual(0);
    expect(body.getOrPassStationNum).toBeLessThanOrEqual(body.stationNum);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyProgress/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/companyProgress", () => {
  it("認証済みで全会社進捗一覧を返す(各要素に進捗情報が含まれる)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/companyProgress",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    for (const item of body) {
      expect(item).toHaveProperty("stationNum");
      expect(item).toHaveProperty("getOrPassStationNum");
      expect(item.getOrPassStationNum).toBeLessThanOrEqual(item.stationNum);
    }
  });
});

describe("GET /api/prefProgress/:prefCode", () => {
  it("認証済みで都道府県進捗を返す(stationNumとgetOrPassStationNumが含まれる)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefProgress/1",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("stationNum");
    expect(body).toHaveProperty("getOrPassStationNum");
    expect(body.stationNum).toBeGreaterThan(0);
    expect(body.getOrPassStationNum).toBeGreaterThanOrEqual(0);
    expect(body.getOrPassStationNum).toBeLessThanOrEqual(body.stationNum);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefProgress/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/prefProgress", () => {
  it("認証済みで全都道府県進捗一覧を返す(47都道府県分)", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/prefProgress",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(47);
    for (const item of body) {
      expect(item).toHaveProperty("stationNum");
      expect(item).toHaveProperty("getOrPassStationNum");
      expect(item.getOrPassStationNum).toBeLessThanOrEqual(item.stationNum);
    }
  });
});
