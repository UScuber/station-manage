import { RecordState } from "../api/types";

export const RECORD_STATE_LABELS: Record<number, string> = {
  [RecordState.Get]: "乗降",
  [RecordState.Pass]: "通過",
};

export const RECORD_STATE_LABELS_WITH_GROUP: Record<number, string> = {
  ...RECORD_STATE_LABELS,
  2: "立ち寄り",
};
