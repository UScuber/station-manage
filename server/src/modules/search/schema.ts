import { Type, type Static } from "@sinclair/typebox";

export const PaginatedSearchQuery = Type.Object({
  off: Type.Integer({ minimum: 0 }),
  len: Type.Integer({ minimum: 1, maximum: 100 }),
  name: Type.Optional(Type.String({ default: "" })),
});

export const SearchCountQuery = Type.Object({
  name: Type.Optional(Type.String({ default: "" })),
});

export const NearestStationQuery = Type.Object({
  lat: Type.Number(),
  lng: Type.Number(),
  num: Type.Optional(Type.Integer({ minimum: 1, maximum: 20, default: 20 })),
});

export type PaginatedSearchQuery = Static<typeof PaginatedSearchQuery>;
export type SearchCountQuery = Static<typeof SearchCountQuery>;
export type NearestStationQuery = Static<typeof NearestStationQuery>;
