import { format } from "date-fns";

export const convert_date = (date: string | Date): string => {
  const d = date instanceof Date ? date : new Date(date);
  return format(d, "yyyy-MM-dd HH:mm:ss");
};
