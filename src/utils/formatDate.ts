import { format } from "date-fns";

/** "2025-01-15" */
export const formatDate = (date: Date): string => format(date, "yyyy-MM-dd");

/** "2025-01-15 12:30" */
export const formatDateTime = (date: Date): string =>
  format(date, "yyyy-MM-dd HH:mm");

/** "2025-01-15 12:30:45" */
export const formatDateTimeFull = (date: Date): string =>
  format(date, "yyyy-MM-dd HH:mm:ss");

/** "12:30" */
export const formatTime = (date: Date): string => format(date, "HH:mm");
