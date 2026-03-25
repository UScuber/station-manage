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

export const ImportStationURLBody = Type.Object({
  data: Type.Array(
    Type.Object({
      stationCode: Type.Integer(),
      timetable: Type.Array(
        Type.Object({
          direction: Type.String(),
          url: Type.String(),
        }),
      ),
      trainPosURL: Type.Union([Type.String(), Type.Null()]),
    }),
  ),
});

export type StationCodeParams = Static<typeof StationCodeParams>;
export type UpdateTimetableURLBody = Static<typeof UpdateTimetableURLBody>;
export type UpdateTrainPosURLBody = Static<typeof UpdateTrainPosURLBody>;
export type ImportStationURLBody = Static<typeof ImportStationURLBody>;
