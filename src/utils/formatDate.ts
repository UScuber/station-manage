const pad = (n: number): string => String(n).padStart(2, "0");

/** "2025-01-15" */
export const formatDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** "2025-01-15 12:30" */
export const formatDateTime = (date: Date): string =>
  `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;

/** "2025-01-15 12:30:45" */
export const formatDateTimeFull = (date: Date): string =>
  `${formatDateTime(date)}:${pad(date.getSeconds())}`;

/** "12:30" */
export const formatTime = (date: Date): string =>
  `${pad(date.getHours())}:${pad(date.getMinutes())}`;
