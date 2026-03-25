export const RecordState = { Get: 0, Pass: 1, GroupVisit: 2 } as const;
export type RecordState = (typeof RecordState)[keyof typeof RecordState];

export const VisitType = { None: 0, Pass: 1, Get: 2, GateExit: 3 } as const;
export type VisitType = (typeof VisitType)[keyof typeof VisitType];

export const JR_COMPANY_CODE_MAX = 6;
