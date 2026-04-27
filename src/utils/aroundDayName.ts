import {
  differenceInCalendarDays,
  differenceInCalendarYears,
  isSameMonth,
  isSameWeek,
  startOfDay,
  subMonths,
  subWeeks,
} from "date-fns";

// 大まかな日付(○○日前)を計算
const aroundDayName = (date: Date): string => {
  const now = startOfDay(new Date());
  const target = startOfDay(date);

  const diffDays = differenceInCalendarDays(now, target);
  if (diffDays === 0) return "今日";
  if (diffDays === 1) return "昨日";
  if (diffDays === 2) return "おととい";

  if (isSameWeek(target, now, { weekStartsOn: 0 })) return "今週";
  if (isSameWeek(target, subWeeks(now, 1), { weekStartsOn: 0 })) return "先週";

  if (isSameMonth(target, now)) return "今月";
  if (isSameMonth(target, subMonths(now, 1))) return "先月";

  const diffYears = differenceInCalendarYears(now, target);
  if (diffYears === 0) return "今年";
  if (diffYears === 1) return "去年";
  if (diffYears === 2) return "おととし";

  return "";
};

export default aroundDayName;
