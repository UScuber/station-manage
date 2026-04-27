import { VisitType } from "../api/types";

export const VISIT_TYPE_STYLE = {
  [VisitType.None]: {
    color: "#ffffff",
    strokeColor: "#000000",
    sizeScale: 1.0,
  },
  [VisitType.Pass]: {
    color: "#34aadc",
    strokeColor: "#ffffff",
    sizeScale: 1.0,
  },
  [VisitType.Get]: { color: "#ff9500", strokeColor: "#ffffff", sizeScale: 1.2 },
  [VisitType.GateExit]: {
    color: "#e60012",
    strokeColor: "#ffffff",
    sizeScale: 1.4,
  },
} as const;
