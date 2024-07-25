// 任意の日付を送信するフォーム 
import { FormEvent, useState } from "react";
import {
  Button,
  Typography,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  FormHelperText,
} from "@mui/material";
import { DatePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ja";
import { RecordState } from "../api";
import { Collapser } from ".";


export const CustomSubmitFormStation = (
  { onSubmit }
  :{
    onSubmit: (date: Date, state: RecordState) => unknown,
  }
) => {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [time, setTime] = useState<Dayjs | null>(null);
  const [radioState, setRadioState] = useState<RecordState | null>(null);
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState("");

  const onSubmitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if(date === null || time === null || date > dayjs()){
      setError(true);
      setHelperText("日付を選択してください");
    }else if(radioState === null){
      setError(true);
      setHelperText("選択してください");
      return;
    }else{
      setError(false);
      setHelperText("追加されました");
      onSubmit(new Date(date.format("YYYY-MM-DD") + " " + time.format("HH:mm:ss")), radioState);
      // reset
      setDate(null);
      setTime(null);
      setRadioState(null);
    }
  };

  return (
    <Collapser
      buttonText={<Typography variant="h6" sx={{ display: "inline" }}>カスタム</Typography>}
      sx={{ mb: 2 }}
      collapseSx={{ mx: 2 }}
    >
      <form onSubmit={onSubmitForm}>
        <FormControl error={error} variant="standard" required>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="ja"
            dateFormats={{ year: "YYYY", month: "M月" }}
          >
            <DatePicker
              label="日付"
              value={date}
              onChange={(date) => setDate(date)}
              slotProps={{
                textField: { size: "small" },
                toolbar: { toolbarFormat: "YYYY年 M月" },
              }}
              format="YYYY-MM-DD"
              sx={{ display: "inline-block", mb: 1 }}
              disableFuture
            />
            <TimePicker
              label="時間"
              value={time}
              onChange={(time) => setTime(time)}
              slotProps={{ textField: { size: "small" } }}
              views={["hours", "minutes", "seconds"]}
              sx={{ mb: 1 }}
            />
          </LocalizationProvider>
          <RadioGroup
            name="state"
            value={radioState}
            onChange={(e) => setRadioState(+e.target.value)}
            row
          >
            <FormControlLabel value={RecordState.Get} control={<Radio size="small" />} label="乗降" />
            <FormControlLabel value={RecordState.Pass} control={<Radio size="small" />} label="通過" />
          </RadioGroup>
          <FormHelperText>{helperText}</FormHelperText>
          <Button type="submit" variant="outlined" sx={{ mt: 1 }}>送信</Button>
        </FormControl>
      </form>
    </Collapser>
  );
};



export const CustomSubmitFormGroup = (
  { onSubmit }
  :{
    onSubmit: (date: Date) => unknown,
  }
) => {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [time, setTime] = useState<Dayjs | null>(null);
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState("");

  const onSubmitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if(date === null || time === null || date > dayjs()){
      setError(true);
      setHelperText("日付を選択してください");
    }else{
      setError(false);
      setHelperText("追加されました");
      onSubmit(new Date(date.format("YYYY-MM-DD") + " " + time.format("HH:mm:ss")));
      // reset
      setDate(null);
      setTime(null);
    }
  };

  return (
    <Collapser
      buttonText={<Typography variant="h6" sx={{ display: "inline" }}>カスタム</Typography>}
      sx={{ mb: 2 }}
      collapseSx={{ mx: 2 }}
    >
      <form onSubmit={onSubmitForm}>
        <FormControl error={error} variant="standard" required>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="ja"
            dateFormats={{ year: "YYYY", month: "M月" }}
          >
            <DatePicker
              label="日付"
              value={date}
              onChange={(date) => setDate(date)}
              slotProps={{
                textField: { size: "small" },
                toolbar: { toolbarFormat: "YYYY年 M月" },
              }}
              format="YYYY-MM-DD"
              sx={{ display: "inline-block", mb: 1 }}
              disableFuture
            />
            <TimePicker
              label="時間"
              value={time}
              onChange={(time) => setTime(time)}
              slotProps={{ textField: { size: "small" } }}
              views={["hours", "minutes", "seconds"]}
              sx={{ mb: 1 }}
            />
          </LocalizationProvider>
          <FormHelperText>{helperText}</FormHelperText>
          <Button type="submit" variant="outlined" sx={{ mt: 1 }}>送信</Button>
        </FormControl>
      </form>
    </Collapser>
  );
};
