import { formatDate, formatDateTime, formatDateTimeFull } from "./formatDate";

/**
 * @deprecated formatDate / formatDateTime / formatDateTimeFull を使用してください。
 */
const getDateString = (
  date: Date,
  disableSeconds?: boolean,
  disableHour?: boolean,
): string => {
  if (disableHour) return formatDate(date);
  if (disableSeconds) return formatDateTime(date);
  return formatDateTimeFull(date);
};

export default getDateString;
