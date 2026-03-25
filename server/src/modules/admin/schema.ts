import { Type, type Static } from "@sinclair/typebox";

export const StationCodeParams = Type.Object({
  stationCode: Type.Integer(),
});

export const UpdateTimetableURLBody = Type.Object({
  code: Type.Integer(),
  direction: Type.String(),
  mode: Type.Union([Type.Literal("update"), Type.Literal("delete")]),
  url: Type.Optional(Type.String()),
});

export const UpdateTrainPosURLBody = Type.Object({
  code: Type.Integer(),
  url: Type.String(),
});

export type StationCodeParams = Static<typeof StationCodeParams>;
export type UpdateTimetableURLBody = Static<typeof UpdateTimetableURLBody>;
export type UpdateTrainPosURLBody = Static<typeof UpdateTrainPosURLBody>;
