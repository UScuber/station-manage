import { format } from "date-fns";
import { InvalidValueError } from "./errors";

export const convert_date = (date: string | Date): string => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    throw new InvalidValueError("invalid date: " + String(date));
  }
  return format(d, "yyyy-MM-dd HH:mm:ss");
};
