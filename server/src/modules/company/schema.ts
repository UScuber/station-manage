import { Type, type Static } from "@sinclair/typebox";

export const CompanyCodeParams = Type.Object({
  companyCode: Type.Integer(),
});

export type CompanyCodeParams = Static<typeof CompanyCodeParams>;
