// 大まかな日付(○○日前)を計算
const aroundDayName = (date: Date): string => {
  let past = date;
  let now = new Date();
  past = new Date(past.getFullYear(), past.getMonth(), past.getDate());
  now = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (past.getTime() === now.getTime()) {
    return "今日";
  }
  past.setDate(past.getDate() + 1);
  if (past.getTime() === now.getTime()) {
    return "昨日";
  }
  past.setDate(past.getDate() + 1);
  if (past.getTime() === now.getTime()) {
    return "おととい";
  }
  // 1 week
  past.setDate(past.getDate() - 2);
  const pastDay = past.getDay(),
    nowDay = now.getDay();
  past.setDate(past.getDate() - pastDay);
  now.setDate(now.getDate() - nowDay);
  if (past.getTime() === now.getTime()) {
    return "今週";
  }
  past.setDate(past.getDate() + 7);
  if (past.getTime() === now.getTime()) {
    return "先週";
  }
  past.setDate(past.getDate() - 7 + pastDay);
  now.setDate(now.getDate() + nowDay);
  past.setDate(1);
  now.setDate(1);
  if (past.getTime() === now.getTime()) {
    return "今月";
  }
  past.setMonth(past.getMonth() + 1);
  if (past.getTime() === now.getTime()) {
    return "先月";
  }
  past.setMonth(past.getMonth() - 1);
  if (past.getFullYear() === now.getFullYear()) {
    return "今年";
  }
  if (past.getFullYear() + 1 === now.getFullYear()) {
    return "去年";
  }
  if (past.getFullYear() + 2 === now.getFullYear()) {
    return "おととし";
  }
  return "";
};

export default aroundDayName;
