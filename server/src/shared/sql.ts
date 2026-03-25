export const escapeLikePattern = (str: string): string =>
  str.replace(/[%_]/g, "\\$&");
