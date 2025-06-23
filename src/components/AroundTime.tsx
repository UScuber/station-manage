import { useEffect, useState } from "react";
import { Button, CircularProgress, Typography } from "@mui/material";
import getDateString from "../utils/getDateString";
import {
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from "date-fns";

// 現在時刻からの大まかな時間差を求める
const getRelativeTime = (
  date: Date | undefined,
  invalidMsg: string
): string => {
  if (!date) return invalidMsg;

  const now = new Date();

  const seconds = differenceInSeconds(now, date);
  if (seconds < 60) {
    if (seconds === 0) return "現在";
    return seconds + "秒前";
  }

  const minutes = differenceInMinutes(now, date);
  if (minutes < 60) return minutes + "分前";

  const hours = differenceInHours(now, date);
  if (hours < 24) return hours + "時間前";

  const days = differenceInDays(now, date);
  if (days < 30) return days + "日前";

  const months = differenceInMonths(now, date);
  if (months < 12) return months + "ヶ月前";

  const years = differenceInYears(now, date);
  return years + "年前";
};

const AroundTime = ({
  date,
  invalidMsg,
  disableMinute,
  fontSize,
  isLoading,
}: {
  date: Date | undefined;
  invalidMsg: string;
  disableMinute?: boolean;
  fontSize?: number;
  isLoading?: boolean;
}): JSX.Element => {
  const [isDisplayDate, setIsDisplayDate] = useState(false);

  useEffect(() => {
    setIsDisplayDate(false);
  }, [date]);

  return (
    <Button
      color="inherit"
      onClick={() => setIsDisplayDate(true)}
      sx={{ display: "inline-block", minWidth: 40, padding: 0 }}
    >
      {isLoading ? (
        <CircularProgress color="inherit" size={fontSize ?? 24} />
      ) : (
        <Typography variant="h6" sx={{ lineHeight: 1, fontSize: fontSize }}>
          {isDisplayDate && date
            ? getDateString(date, disableMinute)
            : getRelativeTime(date, invalidMsg)}
        </Typography>
      )}
    </Button>
  );
};

export default AroundTime;
