import { Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";

// 現在時刻からの大まかな時間差を求める
const getAroundTime = (date: Date | string): string => {
  if(new Date(date).toString() === "Invalid Date") return date.toString();
  const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if(diff < 60){
    if(diff === 0) return "現在";
    return diff + "秒前";
  }
  if(diff < 60*60){
    return Math.floor(diff / 60) + "分前";
  }
  if(diff < 60*60*24){
    return Math.floor(diff / (60*60)) + "時間前";
  }
  if(diff < 60*60*24*30){
    return Math.floor(diff / (60*60*24)) + "日前";
  }
  if(diff < 60*60*24*30*12){
    return Math.floor(diff / (60*60*24*30)) + "ヶ月前";
  }
  return Math.floor(diff / (60*60*24*30*12)) + "年前";
};

const getDateString = (date: Date, disableMinute: boolean | undefined): string => {
  return `${date.getFullYear()}-${("0"+date.getMonth()+1).slice(-2)}-${("0"+date.getDate()).slice(-2)} ${("0"+date.getHours()).slice(-2)}:${("0"+date.getMinutes()).slice(-2)}`
    + (disableMinute ? "" : ("0"+date.getSeconds()).slice(-2));
};

const AroundTime = (
  { date, disableMinute, fontSize }
  :{
    date: string,
    disableMinute?: boolean,
    fontSize?: number | string,
  }
): JSX.Element => {
  const [isDisplayDate, setIsDisplayDate] = useState(false);

  useEffect(() => {
    setIsDisplayDate(false);
  }, [date]);

  return (
    <Button
      color="inherit"
      onClick={() => setIsDisplayDate(true)}
      sx={{ display: "inline-block", textTransform: "none", minWidth: 40, paddingX: 0 }}
    >
      <Typography variant="h6" sx={{ lineHeight: 1, fontSize: fontSize }}>
        {isDisplayDate && new Date(date).toString() !== "Invalid Date" ? getDateString(new Date(date), disableMinute) : getAroundTime(date)}
      </Typography>
    </Button>
  );
};

export default AroundTime;
