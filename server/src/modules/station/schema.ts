import { Type, type Static } from "@sinclair/typebox";

export const StationCodeParams = Type.Object({
  stationCode: Type.Integer(),
});

export const StationGroupCodeParams = Type.Object({
  stationGroupCode: Type.Integer(),
});

export type StationCodeParams = Static<typeof StationCodeParams>;
export type StationGroupCodeParams = Static<typeof StationGroupCodeParams>;
