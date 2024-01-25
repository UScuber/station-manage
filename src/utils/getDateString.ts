// 日付を文字列に変換する
const getDateString = (date: Date, disableMinute?: boolean): string => {
  return `${date.getFullYear()}-${("0"+date.getMonth()+1).slice(-2)}-${("0"+date.getDate()).slice(-2)} ${("0"+date.getHours()).slice(-2)}:${("0"+date.getMinutes()).slice(-2)}`
    + (disableMinute ? "" : ":" + ("0"+date.getSeconds()).slice(-2));
};

export default getDateString;
