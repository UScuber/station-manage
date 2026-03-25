import { Type, type Static } from "@sinclair/typebox";

export const RailwayCodeParams = Type.Object({
  railwayCode: Type.Integer(),
});

export const CompanyCodeParams = Type.Object({
  companyCode: Type.Integer(),
});

export const PrefCodeParams = Type.Object({
  prefCode: Type.Integer({ minimum: 1, maximum: 47 }),
});

export type RailwayCodeParams = Static<typeof RailwayCodeParams>;
export type CompanyCodeParams = Static<typeof CompanyCodeParams>;
export type PrefCodeParams = Static<typeof PrefCodeParams>;
