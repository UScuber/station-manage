import { Type, type Static } from "@sinclair/typebox";

export const StationCodeParams = Type.Object({
  stationCode: Type.Integer(),
});

export const StationGroupCodeParams = Type.Object({
  stationGroupCode: Type.Integer(),
});

export const RailwayCodeParams = Type.Object({
  railwayCode: Type.Integer(),
});

export const HistoryFilterQuery = Type.Object({
  name: Type.Optional(Type.String({ default: "" })),
  type: Type.Optional(Type.Union([
    Type.Literal("station"),
    Type.Literal("railway"),
    Type.Literal("company"),
  ])),
  dateFrom: Type.Optional(Type.String({ format: "date-time" })),
  dateTo: Type.Optional(Type.String({ format: "date-time" })),
});

export const HistoryListQuery = Type.Intersect([
  Type.Object({
    off: Type.Integer({ minimum: 0 }),
    len: Type.Integer({ minimum: 1, maximum: 200 }),
  }),
  HistoryFilterQuery,
]);

export const PaginatedSearchHistoryQuery = Type.Object({
  off: Type.Integer({ minimum: 0 }),
  len: Type.Integer({ minimum: 1, maximum: 100 }),
  name: Type.Optional(Type.String({ default: "" })),
});

export const StationDateBody = Type.Object({
  code: Type.Integer(),
  date: Type.String({ format: "date-time" }),
  state: Type.Integer({ minimum: 0, maximum: 1 }),
});

export const StationGroupDateBody = Type.Object({
  code: Type.Integer(),
  date: Type.String({ format: "date-time" }),
});

const HistoryExportStationInfo = Type.Object({
  stationGroupCode: Type.Integer(),
  railwayCode: Type.Integer(),
  latitude: Type.Number(),
  longitude: Type.Number(),
  stationName: Type.String(),
  railwayName: Type.String(),
  companyName: Type.String(),
});

const HistoryExportStationGroupInfo = Type.Object({
  stationName: Type.String(),
  kana: Type.String(),
  latitude: Type.Number(),
  longitude: Type.Number(),
  prefCode: Type.Integer(),
});

export const ImportHistoryBody = Type.Object({
  station_history: Type.Array(Type.Object({
    history: Type.Array(Type.Object({
      date: Type.String(),
      state: Type.Integer({ minimum: 0, maximum: 1 }),
    })),
    info: HistoryExportStationInfo,
  })),
  station_group_history: Type.Array(Type.Object({
    history: Type.Array(Type.Object({
      date: Type.String(),
    })),
    info: HistoryExportStationGroupInfo,
  })),
});

export type StationCodeParams = Static<typeof StationCodeParams>;
export type StationGroupCodeParams = Static<typeof StationGroupCodeParams>;
export type RailwayCodeParams = Static<typeof RailwayCodeParams>;
export type HistoryFilterQuery = Static<typeof HistoryFilterQuery>;
export type HistoryListQuery = Static<typeof HistoryListQuery>;
export type PaginatedSearchHistoryQuery = Static<typeof PaginatedSearchHistoryQuery>;
export type StationDateBody = Static<typeof StationDateBody>;
export type StationGroupDateBody = Static<typeof StationGroupDateBody>;
export type ImportHistoryBody = Static<typeof ImportHistoryBody>;
