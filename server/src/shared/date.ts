import { format } from "date-fns";
import { InvalidValueError } from "./errors";

export const convertDate = (date: string | Date | number): string => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    throw new InvalidValueError("invalid date: " + String(date));
  }
  return format(d, "yyyy-MM-dd HH:mm:ss");
};
