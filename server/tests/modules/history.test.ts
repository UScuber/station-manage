import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp, loginTestUser, loginTestUserWithName } from "../helper";
import {
  SEED_STATION_HISTORY_RECORDS,
  seedHistory,
} from "../seed-history";
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

// --- 未認証テスト ---

describe("認証必須エンドポイント", () => {
  const endpoints = [
    { method: "GET" as const, url: "/api/latestStationHistory/1110101" },
    { method: "GET" as const, url: "/api/latestRailwayStationHistory/11101" },
    { method: "GET" as const, url: "/api/latestStationGroupHistory/11101010" },
    { method: "GET" as const, url: "/api/stationHistory?off=0&len=10" },
    { method: "GET" as const, url: "/api/stationHistoryCount" },
    { method: "GET" as const, url: "/api/stationHistoryAndInfo" },
    { method: "GET" as const, url: "/api/stationHistory/1110101" },
    { method: "GET" as const, url: "/api/stationGroupHistory/11101010" },
    {
      method: "GET" as const,
      url: "/api/searchStationGroupListHistory?off=0&len=10",
    },
  ];

  for (const { method, url } of endpoints) {
    it(`${method} ${url} は未認証で401を返す`, async () => {
      const res = await app.inject({ method, url });
      expect(res.statusCode).toBe(401);
    });
  }
});

describe("同一履歴データでのユーザー分離(history)", () => {
  let userACookie: string;
  let userBCookie: string;
  const aOnlyGroupRecord = {
    code: 11101010,
    date: "2025-07-05T00:00:00.000Z",
  };
  const aOnlyStationRecord = {
    code: 1110103,
    date: "2025-07-06T00:00:00.000Z",
    state: 0,
  };

  beforeAll(async () => {
    userACookie = await loginTestUserWithName(app, "履歴分離ユーザーA");
    userBCookie = await loginTestUserWithName(app, "履歴分離ユーザーB");
    await seedHistory(app, userACookie);
    await seedHistory(app, userBCookie);
  });

  it("同じ取得方法ならA/Bで同じ履歴を返す", async () => {
    const [stationA, stationB, latestA, latestB, groupA, groupB] =
      await Promise.all([
        app.inject({
          method: "GET",
          url: "/api/stationHistory/1110101",
          headers: { cookie: userACookie },
        }),
        app.inject({
          method: "GET",
          url: "/api/stationHistory/1110101",
          headers: { cookie: userBCookie },
        }),
        app.inject({
          method: "GET",
          url: "/api/latestStationHistory/1110101",
          headers: { cookie: userACookie },
        }),
        app.inject({
          method: "GET",
          url: "/api/latestStationHistory/1110101",
          headers: { cookie: userBCookie },
        }),
        app.inject({
          method: "GET",
          url: "/api/stationGroupHistory/11101010",
          headers: { cookie: userACookie },
        }),
        app.inject({
          method: "GET",
          url: "/api/stationGroupHistory/11101010",
          headers: { cookie: userBCookie },
        }),
      ]);

    expect(stationA.statusCode).toBe(200);
    expect(stationB.statusCode).toBe(200);
    expect(latestA.statusCode).toBe(200);
    expect(latestB.statusCode).toBe(200);
    expect(groupA.statusCode).toBe(200);
    expect(groupB.statusCode).toBe(200);

    expect(stationA.json()).toEqual(stationB.json());
    expect(latestA.json()).toEqual(latestB.json());
    expect(groupA.json()).toEqual(groupB.json());
  });

  it("同じ取得方法なら一覧系APIでもA/Bで同じ結果を返す", async () => {
    const [
      latestRailA,
      latestRailB,
      listA,
      listB,
      countA,
      countB,
      infoA,
      infoB,
      latestGroupA,
      latestGroupB,
      searchA,
      searchB,
      exportA,
      exportB,
    ] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/latestRailwayStationHistory/11101",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/latestRailwayStationHistory/11101",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/stationHistory?off=0&len=10",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/stationHistory?off=0&len=10",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/stationHistoryCount",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/stationHistoryCount",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/stationHistoryAndInfo",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/stationHistoryAndInfo",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/latestStationGroupHistory/11101010",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/latestStationGroupHistory/11101010",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/searchStationGroupListHistory?name=函館&off=0&len=10",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/searchStationGroupListHistory?name=函館&off=0&len=10",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "POST",
        url: "/api/exportHistory",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "POST",
        url: "/api/exportHistory",
        headers: { cookie: userBCookie },
      }),
    ]);

    expect(latestRailA.statusCode).toBe(200);
    expect(latestRailB.statusCode).toBe(200);
    expect(listA.statusCode).toBe(200);
    expect(listB.statusCode).toBe(200);
    expect(countA.statusCode).toBe(200);
    expect(countB.statusCode).toBe(200);
    expect(infoA.statusCode).toBe(200);
    expect(infoB.statusCode).toBe(200);
    expect(latestGroupA.statusCode).toBe(200);
    expect(latestGroupB.statusCode).toBe(200);
    expect(searchA.statusCode).toBe(200);
    expect(searchB.statusCode).toBe(200);
    expect(exportA.statusCode).toBe(200);
    expect(exportB.statusCode).toBe(200);

    expect(latestRailA.json()).toEqual(latestRailB.json());
    expect(listA.json()).toEqual(listB.json());
    expect(countA.json()).toEqual(countB.json());
    expect(infoA.json()).toEqual(infoB.json());
    expect(latestGroupA.json()).toEqual(latestGroupB.json());
    expect(searchA.json()).toEqual(searchB.json());
    expect(exportA.json()).toEqual(exportB.json());
  });

  it("Aだけ削除しても同じ取得方法でBの履歴は残る", async () => {
    const deleteRes = await app.inject({
      method: "DELETE",
      url: "/api/stationDate",
      headers: { cookie: userACookie },
      payload: SEED_STATION_HISTORY_RECORDS[0],
    });
    expect(deleteRes.statusCode).toBe(200);

    const [stationA, stationB, latestA, latestB] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/stationHistory/1110101",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/stationHistory/1110101",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/latestStationHistory/1110101",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/latestStationHistory/1110101",
        headers: { cookie: userBCookie },
      }),
    ]);

    expect(stationA.statusCode).toBe(200);
    expect(stationB.statusCode).toBe(200);
    expect(latestA.statusCode).toBe(200);
    expect(latestB.statusCode).toBe(200);

    const stationBodyA = stationA.json();
    const stationBodyB = stationB.json();
    expect(Array.isArray(stationBodyA)).toBe(true);
    expect(Array.isArray(stationBodyB)).toBe(true);
    expect(stationBodyA.length).toBe(0);
    expect(stationBodyB).toContainEqual(
      expect.objectContaining({ stationCode: 1110101, state: 0 }),
    );

    expect(latestA.json()).toEqual({ getDate: null, passDate: null });
    expect(latestB.json()).toEqual(expect.objectContaining({ passDate: null }));
    expect(latestB.json().getDate).not.toBeNull();
  });

  it("Aだけグループ履歴を追加するとlatestStationGroupHistoryに差が出る", async () => {
    const addRes = await app.inject({
      method: "POST",
      url: "/api/stationGroupDate",
      headers: { cookie: userACookie },
      payload: aOnlyGroupRecord,
    });
    expect(addRes.statusCode).toBe(200);

    const [latestGroupA, latestGroupB, searchA, searchB] = await Promise.all([
      app.inject({
        method: "GET",
        url: "/api/latestStationGroupHistory/11101010",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/latestStationGroupHistory/11101010",
        headers: { cookie: userBCookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/searchStationGroupListHistory?name=函館&off=0&len=10",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: "/api/searchStationGroupListHistory?name=函館&off=0&len=10",
        headers: { cookie: userBCookie },
      }),
    ]);

    expect(latestGroupA.statusCode).toBe(200);
    expect(latestGroupB.statusCode).toBe(200);
    expect(searchA.statusCode).toBe(200);
    expect(searchB.statusCode).toBe(200);

    expect(latestGroupA.json()).not.toEqual(latestGroupB.json());
    expect(searchA.json()).not.toEqual(searchB.json());
  });

  it("Aだけの履歴はBが削除してもA側に残る", async () => {
    const addRes = await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie: userACookie },
      payload: aOnlyStationRecord,
    });
    expect(addRes.statusCode).toBe(200);

    const deleteByBRes = await app.inject({
      method: "DELETE",
      url: "/api/stationDate",
      headers: { cookie: userBCookie },
      payload: aOnlyStationRecord,
    });
    expect(deleteByBRes.statusCode).toBe(200);

    const [historyA, historyB] = await Promise.all([
      app.inject({
        method: "GET",
        url: `/api/stationHistory/${aOnlyStationRecord.code}`,
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "GET",
        url: `/api/stationHistory/${aOnlyStationRecord.code}`,
        headers: { cookie: userBCookie },
      }),
    ]);

    expect(historyA.statusCode).toBe(200);
    expect(historyB.statusCode).toBe(200);

    expect(historyA.json()).toContainEqual(
      expect.objectContaining({
        stationCode: aOnlyStationRecord.code,
        state: aOnlyStationRecord.state,
      }),
    );
    expect(historyB.json()).toEqual([]);
  });

  it("AだけインポートするとexportHistoryと履歴件数に差が出る", async () => {
    const exportBBefore = await app.inject({
      method: "POST",
      url: "/api/exportHistory",
      headers: { cookie: userBCookie },
    });
    expect(exportBBefore.statusCode).toBe(200);

    const exportA = await app.inject({
      method: "POST",
      url: "/api/exportHistory",
      headers: { cookie: userACookie },
    });
    expect(exportA.statusCode).toBe(200);
    const exportBodyA = exportA.json();
    const sampleInfo = exportBodyA.station_history[0]?.info;
    expect(sampleInfo).toBeDefined();

    const importRes = await app.inject({
      method: "POST",
      url: "/api/importHistory",
      headers: { cookie: userACookie },
      payload: {
        station_history: [
          {
            history: [{ date: "2025-07-07T00:00:00.000Z", state: 0 }],
            info: sampleInfo,
          },
        ],
        station_group_history: [],
      },
    });
    expect(importRes.statusCode).toBe(200);

    const [exportAAfter, exportBAfter] = await Promise.all([
      app.inject({
        method: "POST",
        url: "/api/exportHistory",
        headers: { cookie: userACookie },
      }),
      app.inject({
        method: "POST",
        url: "/api/exportHistory",
        headers: { cookie: userBCookie },
      }),
    ]);

    expect(exportAAfter.statusCode).toBe(200);
    expect(exportBAfter.statusCode).toBe(200);

    expect(exportAAfter.json()).not.toEqual(exportBAfter.json());
    expect(exportBAfter.json()).toEqual(exportBBefore.json());
  });
});

describe("履歴0件ユーザーの挙動", () => {
  let userCCookie: string;

  beforeAll(async () => {
    userCCookie = await loginTestUserWithName(app, "履歴0件ユーザーC");
  });

  it("同じ取得方法で常に空・0・nullを返す", async () => {
    const [listRes, countRes, latestStationRes, latestGroupRes, groupRes] =
      await Promise.all([
        app.inject({
          method: "GET",
          url: "/api/stationHistory?off=0&len=10",
          headers: { cookie: userCCookie },
        }),
        app.inject({
          method: "GET",
          url: "/api/stationHistoryCount",
          headers: { cookie: userCCookie },
        }),
        app.inject({
          method: "GET",
          url: "/api/latestStationHistory/1110101",
          headers: { cookie: userCCookie },
        }),
        app.inject({
          method: "GET",
          url: "/api/latestStationGroupHistory/11101010",
          headers: { cookie: userCCookie },
        }),
        app.inject({
          method: "GET",
          url: "/api/stationGroupHistory/11101010",
          headers: { cookie: userCCookie },
        }),
      ]);

    expect(listRes.statusCode).toBe(200);
    expect(countRes.statusCode).toBe(200);
    expect(latestStationRes.statusCode).toBe(200);
    expect(latestGroupRes.statusCode).toBe(200);
    expect(groupRes.statusCode).toBe(200);

    expect(listRes.json()).toEqual([]);
    expect(countRes.json()).toBe(0);
    expect(latestStationRes.json()).toEqual({ getDate: null, passDate: null });
    expect(latestGroupRes.json()).toEqual({ date: null });
    expect(groupRes.json()).toEqual([]);
  });
});

// --- 認証済みGETテスト ---

describe("GET /api/latestStationHistory/:stationCode", () => {
  it("認証済みで履歴情報を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/latestStationHistory/1110101",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/latestStationHistory/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/latestRailwayStationHistory/:railwayCode", () => {
  it("認証済みで履歴情報を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/latestRailwayStationHistory/11101",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/latestRailwayStationHistory/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/latestStationGroupHistory/:stationGroupCode", () => {
  it("認証済みで履歴情報を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/latestStationGroupHistory/11101010",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/latestStationGroupHistory/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/stationHistory", () => {
  it("認証済みで履歴一覧を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistory?off=0&len=10",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("必須パラメータ不足で400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistory",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });

  it("lenの上限を超えると400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistory?off=0&len=201",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/stationHistoryCount", () => {
  it("認証済みで件数を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistoryCount",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toBeTypeOf("number");
  });
});

describe("GET /api/stationHistoryAndInfo", () => {
  it("認証済みで履歴詳細情報を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistoryAndInfo",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe("GET /api/stationHistory/:stationCode", () => {
  it("認証済みで駅の履歴を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistory/1110101",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistory/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/stationGroupHistory/:stationGroupCode", () => {
  it("認証済みでグループの履歴を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationGroupHistory/11101010",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("不正なパラメータで400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationGroupHistory/abc",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("GET /api/searchStationGroupListHistory", () => {
  it("認証済みで検索結果を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupListHistory?off=0&len=10",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("名前指定で検索できる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupListHistory?name=函館&off=0&len=10",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("必須パラメータ不足で400を返す", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/searchStationGroupListHistory",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(400);
  });
});

// --- フィルタクエリテスト ---

describe("GET /api/stationHistory フィルタリング", () => {
  it("dateFromで日付の下限を絞り込める", async () => {
    // まず履歴を追加
    await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie },
      payload: { code: 1110101, date: "2025-06-01T00:00:00.000Z", state: 0 },
    });
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistory?off=0&len=10&dateFrom=2025-05-01T00:00:00.000Z",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("dateToで日付の上限を絞り込める", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistory?off=0&len=10&dateTo=2024-01-01T00:00:00.000Z",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(0);
  });

  it("dateFromとdateToの組み合わせで絞り込める", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistory?off=0&len=10&dateFrom=2025-01-01T00:00:00.000Z&dateTo=2025-12-31T00:00:00.000Z",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("typeパラメータでstation指定ができる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistory?off=0&len=10&type=station&name=函館",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("typeパラメータでrailway指定ができる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistory?off=0&len=10&type=railway&name=函館",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it("typeパラメータでcompany指定ができる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistory?off=0&len=10&type=company&name=JR",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

describe("GET /api/stationHistoryCount フィルタリング", () => {
  it("name指定でカウントを取得できる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistoryCount?name=函館",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toBeTypeOf("number");
  });

  it("dateFrom指定でカウントを取得できる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistoryCount?dateFrom=2025-01-01T00:00:00.000Z",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toBeTypeOf("number");
    expect(body).toBeGreaterThan(0);
  });
});

describe("GET /api/stationHistoryAndInfo レスポンス構造", () => {
  it("各駅にvisitType, left, rightが含まれる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistoryAndInfo",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty("visitType");
      expect(body[0]).toHaveProperty("left");
      expect(body[0]).toHaveProperty("right");
      expect(body[0]).toHaveProperty("stationCode");
    }
  });
});

describe("GET /api/stationHistory/:stationCode レスポンス構造", () => {
  it("各履歴にdateとstateが含まれる", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/stationHistory/1110101",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty("date");
      expect(body[0]).toHaveProperty("state");
    }
  });
});

describe("POST /api/exportHistory レスポンス構造", () => {
  it("station_historyとstation_group_historyが含まれる", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/exportHistory",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("station_history");
    expect(body).toHaveProperty("station_group_history");
    expect(Array.isArray(body.station_history)).toBe(true);
    expect(Array.isArray(body.station_group_history)).toBe(true);
    if (body.station_history.length > 0) {
      expect(body.station_history[0]).toHaveProperty("history");
      expect(body.station_history[0]).toHaveProperty("info");
    }
  });
});

// --- POST/DELETE テスト ---

describe("POST /api/stationDate", () => {
  it("認証済みで駅履歴を登録できる", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie },
      payload: { code: 1110101, date: "2025-01-01T00:00:00.000Z", state: 0 },
    });
    expect(res.statusCode).toBe(200);
  });

  it("未認証で401を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationDate",
      payload: { code: 1110101, date: "2025-01-01T00:00:00.000Z", state: 0 },
    });
    expect(res.statusCode).toBe(401);
  });

  it("不正なbodyで400を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie },
      payload: { code: "abc" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("state=1(Pass)で登録できる", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie },
      payload: { code: 1110102, date: "2025-02-01T00:00:00.000Z", state: 1 },
    });
    expect(res.statusCode).toBe(200);
  });

  it("stateが範囲外(2)で400を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie },
      payload: { code: 1110101, date: "2025-01-01T00:00:00.000Z", state: 2 },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("POST /api/stationGroupDate", () => {
  it("認証済みでグループ履歴を登録できる", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationGroupDate",
      headers: { cookie },
      payload: { code: 11101010, date: "2025-01-01T00:00:00.000Z" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("未認証で401を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationGroupDate",
      payload: { code: 11101010, date: "2025-01-01T00:00:00.000Z" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("不正なbodyで400を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/stationGroupDate",
      headers: { cookie },
      payload: { code: "abc" },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("DELETE /api/stationDate", () => {
  it("認証済みで駅履歴を削除できる", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/stationDate",
      headers: { cookie },
      payload: { code: 1110101, date: "2025-01-01T00:00:00.000Z", state: 0 },
    });
    expect(res.statusCode).toBe(200);
  });

  it("未認証で401を返す", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/stationDate",
      payload: { code: 1110101, date: "2025-01-01T00:00:00.000Z", state: 0 },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("DELETE /api/stationGroupDate", () => {
  it("認証済みでグループ履歴を削除できる", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/stationGroupDate",
      headers: { cookie },
      payload: { code: 11101010, date: "2025-01-01T00:00:00.000Z" },
    });
    expect(res.statusCode).toBe(200);
  });

  it("未認証で401を返す", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/stationGroupDate",
      payload: { code: 11101010, date: "2025-01-01T00:00:00.000Z" },
    });
    expect(res.statusCode).toBe(401);
  });
});

// --- 履歴の追加・削除が反映されるか検証 ---

describe("駅履歴の追加→取得→削除の一連フロー", () => {
  const stationCode = 1110103;
  const date = "2025-03-15T00:00:00.000Z";

  it("追加した履歴がstationHistoryに反映される", async () => {
    await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie },
      payload: { code: stationCode, date, state: 0 },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/stationHistory/${stationCode}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toContainEqual(
      expect.objectContaining({ stationCode, state: 0 }),
    );
  });

  it("追加した履歴がlatestStationHistoryに反映される", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/latestStationHistory/${stationCode}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.getDate).not.toBeNull();
  });

  it("追加した履歴がvisitTypeに反映される", async () => {
    // stationCode=1110103 は railwayCode=11101（北海道の路線）
    const res = await app.inject({
      method: "GET",
      url: "/api/railwayStations/11101",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const target = body.find(
      (s: { stationCode: number }) => s.stationCode === stationCode,
    );
    expect(target).toBeDefined();
    expect(target.visitType).toBeGreaterThan(0);
  });

  it("削除後はstationHistoryから消える", async () => {
    await app.inject({
      method: "DELETE",
      url: "/api/stationDate",
      headers: { cookie },
      payload: { code: stationCode, date, state: 0 },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/stationHistory/${stationCode}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const match = body.find(
      (h: { stationCode: number; state: number }) =>
        h.stationCode === stationCode && h.state === 0,
    );
    expect(match).toBeUndefined();
  });
});

describe("グループ履歴の追加→取得→削除の一連フロー", () => {
  const groupCode = 11101010;
  const date = "2025-04-01T00:00:00.000Z";

  it("追加したグループ履歴がstationGroupHistoryに反映される", async () => {
    await app.inject({
      method: "POST",
      url: "/api/stationGroupDate",
      headers: { cookie },
      payload: { code: groupCode, date },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/stationGroupHistory/${groupCode}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.length).toBeGreaterThan(0);
  });

  it("追加したグループ履歴がlatestStationGroupHistoryに反映される", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/latestStationGroupHistory/${groupCode}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.date).not.toBeNull();
  });

  it("削除後はstationGroupHistoryから消える", async () => {
    await app.inject({
      method: "DELETE",
      url: "/api/stationGroupDate",
      headers: { cookie },
      payload: { code: groupCode, date },
    });

    const res = await app.inject({
      method: "GET",
      url: `/api/stationGroupHistory/${groupCode}`,
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    // グループ直接登録分(stationCode=null)が消えている
    const groupEntry = body.find(
      (h: { stationCode: number | null }) => h.stationCode === null,
    );
    expect(groupEntry).toBeUndefined();
  });
});

describe("エクスポート・インポートの整合性", () => {
  it("追加した履歴がエクスポートに含まれる", async () => {
    // 履歴を追加
    await app.inject({
      method: "POST",
      url: "/api/stationDate",
      headers: { cookie },
      payload: { code: 1110101, date: "2025-05-01T00:00:00.000Z", state: 0 },
    });

    const res = await app.inject({
      method: "POST",
      url: "/api/exportHistory",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    const histories = body.station_history.flatMap(
      (s: { history: { date: string }[] }) => s.history,
    );
    expect(histories.length).toBeGreaterThan(0);
  });

  it("インポートした履歴が反映される", async () => {
    // まずエクスポートして実在する駅のinfo情報を取得
    const exportRes = await app.inject({
      method: "POST",
      url: "/api/exportHistory",
      headers: { cookie },
    });
    const exported = exportRes.json();

    // 既存の履歴から1件目のinfoを流用してインポート用データを作る
    // (駅名・路線名・会社名の逆引きが必要なため実データが必要)
    const sampleInfo = exported.station_history[0]?.info;
    if (!sampleInfo) {
      // 前のテストで追加した履歴があるはずだが、なければスキップ
      return;
    }

    const date = "2025-06-15T00:00:00.000Z";
    await app.inject({
      method: "POST",
      url: "/api/importHistory",
      headers: { cookie },
      payload: {
        station_history: [{ history: [{ date, state: 0 }], info: sampleInfo }],
        station_group_history: [],
      },
    });

    // インポートにより駅名で逆引きされたstationCodeで履歴が取得できる
    const historyRes = await app.inject({
      method: "GET",
      url: "/api/stationHistoryAndInfo",
      headers: { cookie },
    });
    expect(historyRes.statusCode).toBe(200);
    const historyBody = historyRes.json();
    expect(historyBody.length).toBeGreaterThan(0);
  });
});

describe("POST /api/exportHistory", () => {
  it("認証済みで履歴をエクスポートできる", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/exportHistory",
      headers: { cookie },
    });
    expect(res.statusCode).toBe(200);
  });

  it("未認証で401を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/exportHistory",
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("POST /api/importHistory", () => {
  it("認証済みで履歴をインポートできる", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/importHistory",
      headers: { cookie },
      payload: { station_history: [], station_group_history: [] },
    });
    expect(res.statusCode).toBe(200);
  });

  it("未認証で401を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/importHistory",
      payload: { station_history: [], station_group_history: [] },
    });
    expect(res.statusCode).toBe(401);
  });

  it("不正なbodyで400を返す", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/importHistory",
      headers: { cookie },
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });
});
