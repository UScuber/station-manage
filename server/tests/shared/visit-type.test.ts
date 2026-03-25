import { describe, it, expect, vi, beforeEach } from "vitest";
import { VisitType } from "../../src/constants";

// モック用のデータストア
let latestStationHistories: { stationCode: number; state: number }[] = [];
let stationGroupHistories: { stationGroupCode: number; date: string }[] = [];
let stationHistories: { stationCode: number; date: string }[] = [];

vi.mock("../../src/db/connection", () => ({
  db: {
    prepare: (sql: string) => ({
      all: () => {
        if (sql.includes("LatestStationHistory")) return latestStationHistories;
        if (sql.includes("StationGroupHistory")) return stationGroupHistories;
        if (sql.includes("StationHistory")) return stationHistories;
        return [];
      },
    }),
  },
}));

import { attachVisitType } from "../../src/shared/visit-type";

const station = (code: number, groupCode: number) => ({
  stationCode: code,
  stationGroupCode: groupCode,
});

beforeEach(() => {
  latestStationHistories = [];
  stationGroupHistories = [];
  stationHistories = [];
});

describe("attachVisitType", () => {
  it("userIdがnullの場合、全てNoneを返す", () => {
    const result = attachVisitType([station(1, 10)], null);
    expect(result).toEqual([
      { stationCode: 1, stationGroupCode: 10, visitType: VisitType.None },
    ]);
  });

  it("空配列の場合、空配列を返す", () => {
    const result = attachVisitType([], "user1");
    expect(result).toEqual([]);
  });

  it("履歴なしの場合、全てNoneを返す", () => {
    const result = attachVisitType([station(1, 10)], "user1");
    expect(result[0].visitType).toBe(VisitType.None);
  });

  it("Pass履歴のみの場合、Passを返す", () => {
    latestStationHistories = [{ stationCode: 1, state: 1 }]; // RecordState.Pass = 1
    const result = attachVisitType([station(1, 10)], "user1");
    expect(result[0].visitType).toBe(VisitType.Pass);
  });

  it("Get履歴のみ(グループ履歴なし)の場合、Getを返す", () => {
    latestStationHistories = [{ stationCode: 1, state: 0 }]; // RecordState.Get = 0
    const result = attachVisitType([station(1, 10)], "user1");
    expect(result[0].visitType).toBe(VisitType.Get);
  });

  it("Get履歴あり+グループ履歴が24時間以内の場合、GateExitを返す", () => {
    const baseDate = "2025-01-15T12:00:00.000Z";
    const within24h = "2025-01-15T18:00:00.000Z"; // 6時間後
    latestStationHistories = [{ stationCode: 1, state: 0 }];
    stationGroupHistories = [{ stationGroupCode: 10, date: within24h }];
    stationHistories = [{ stationCode: 1, date: baseDate }];
    const result = attachVisitType([station(1, 10)], "user1");
    expect(result[0].visitType).toBe(VisitType.GateExit);
  });

  it("Get履歴あり+グループ履歴がちょうど24時間の場合、GateExitを返す", () => {
    const baseDate = "2025-01-15T12:00:00.000Z";
    const exactly24h = "2025-01-16T12:00:00.000Z";
    latestStationHistories = [{ stationCode: 1, state: 0 }];
    stationGroupHistories = [{ stationGroupCode: 10, date: exactly24h }];
    stationHistories = [{ stationCode: 1, date: baseDate }];
    const result = attachVisitType([station(1, 10)], "user1");
    expect(result[0].visitType).toBe(VisitType.GateExit);
  });

  it("Get履歴あり+グループ履歴が24時間超の場合、Getを返す", () => {
    const baseDate = "2025-01-15T12:00:00.000Z";
    const over24h = "2025-01-16T12:00:01.000Z"; // 24時間1秒後
    latestStationHistories = [{ stationCode: 1, state: 0 }];
    stationGroupHistories = [{ stationGroupCode: 10, date: over24h }];
    stationHistories = [{ stationCode: 1, date: baseDate }];
    const result = attachVisitType([station(1, 10)], "user1");
    expect(result[0].visitType).toBe(VisitType.Get);
  });

  it("GetとPass両方ある場合、Getが優先される", () => {
    latestStationHistories = [
      { stationCode: 1, state: 0 }, // Get
      { stationCode: 1, state: 1 }, // Pass
    ];
    const result = attachVisitType([station(1, 10)], "user1");
    expect(result[0].visitType).toBe(VisitType.Get);
  });

  it("複数駅で異なるvisitTypeを返す", () => {
    latestStationHistories = [
      { stationCode: 1, state: 0 }, // Get
      { stationCode: 2, state: 1 }, // Pass
      // stationCode: 3 は履歴なし
    ];
    const stations = [station(1, 10), station(2, 20), station(3, 30)];
    const result = attachVisitType(stations, "user1");
    expect(result[0].visitType).toBe(VisitType.Get);
    expect(result[1].visitType).toBe(VisitType.Pass);
    expect(result[2].visitType).toBe(VisitType.None);
  });

  it("グループ履歴が駅より24時間前でもGateExitになる", () => {
    const groupDate = "2025-01-15T06:00:00.000Z";
    const stationDate = "2025-01-15T12:00:00.000Z"; // 6時間後
    latestStationHistories = [{ stationCode: 1, state: 0 }];
    stationGroupHistories = [{ stationGroupCode: 10, date: groupDate }];
    stationHistories = [{ stationCode: 1, date: stationDate }];
    const result = attachVisitType([station(1, 10)], "user1");
    expect(result[0].visitType).toBe(VisitType.GateExit);
  });
});
