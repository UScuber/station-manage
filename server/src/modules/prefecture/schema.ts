import { Type, type Static } from "@sinclair/typebox";

export const PrefCodeParams = Type.Object({
  prefCode: Type.Integer({ minimum: 1, maximum: 47 }),
});

export type PrefCodeParams = Static<typeof PrefCodeParams>;
