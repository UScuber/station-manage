import { format } from "date-fns";

export const convert_date = (date: string | Date): string | undefined => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return undefined;
  return format(d, "yyyy-MM-dd HH:mm:ss");
};
