import { Button, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import getDateString from "../utils/getDateString";


// 現在時刻からの大まかな時間差を求める
const getAroundTime = (date: Date | undefined, invalidMsg: string): string => {
  if(!date) return invalidMsg;

  const diff = Math.floor((new Date().getTime() - date.getTime()) / 1000);
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

const AroundTime = (
  { date, invalidMsg, disableMinute, fontSize }
  :{
    date: Date | undefined,
    invalidMsg: string,
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
        {isDisplayDate && date ? getDateString(date, disableMinute) : getAroundTime(date, invalidMsg)}
      </Typography>
    </Button>
  );
};

export default AroundTime;
