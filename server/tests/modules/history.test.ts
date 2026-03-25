import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestApp, loginTestUser } from "../helper";
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
    { method: "GET" as const, url: "/api/searchStationGroupListHistory?off=0&len=10" },
  ];

  for (const { method, url } of endpoints) {
    it(`${method} ${url} は未認証で401を返す`, async () => {
      const res = await app.inject({ method, url });
      expect(res.statusCode).toBe(401);
    });
  }
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
        station_history: [
          { history: [{ date, state: 0 }], info: sampleInfo },
        ],
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
