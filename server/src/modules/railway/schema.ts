import { Type, type Static } from "@sinclair/typebox";

export const RailwayCodeParams = Type.Object({
  railwayCode: Type.Integer(),
});

export type RailwayCodeParams = Static<typeof RailwayCodeParams>;
