import { Type, type Static } from "@sinclair/typebox";

export const RailwayCodeParams = Type.Object({
  railwayCode: Type.Integer(),
});

export const CompanyCodeParams = Type.Object({
  companyCode: Type.Integer(),
});

export type RailwayCodeParams = Static<typeof RailwayCodeParams>;
export type CompanyCodeParams = Static<typeof CompanyCodeParams>;
