// クエリパラメータ生成用の処理を一般化

import dayjs, { Dayjs } from "dayjs";
import getDateString from "./getDateString";

type Accepts = number | string | boolean | Dayjs | undefined | null;

const getURLSearchParams = <T extends Record<string, Accepts>>(
  params: Partial<T>
): URLSearchParams => {
  const entries = Object.entries(params)
    .map(([key, val]) => {
      if (val === undefined || val === null) return null;
      if (dayjs.isDayjs(val))
        return [key, getDateString(val.toDate(), true, true)];
      return [key, val.toString()];
    })
    .filter((elem) => elem !== null);
  return new URLSearchParams(entries);
};

export default getURLSearchParams;
