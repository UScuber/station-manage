import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import {
  useStationHistoryList,
  useStationHistoryCount,
  StationHistoryDetail,
  RecordState,
} from "../api";
import { useAuth } from "../auth";
import { BinaryPagination, Collapser, CustomLink, RespStationName } from "../components";
import getDateString from "../utils/getDateString";
import NotFound from "./NotFound";
import aroundDayName from "../utils/aroundDayName";


const stateNames = ["乗降", "通過"];
const dayNames = ["日", "月", "火", "水", "木", "金", "土"];


const HistoryContent = (
  { history }
  :{
    history: StationHistoryDetail | StationHistoryDetail[]
  }
): JSX.Element => {
  if(!Array.isArray(history)){
    return (
      <Button
        component={Link}
        to={"/station/" + history.stationCode}
        variant="outlined"
        color="inherit"
        sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
      >
        <Box sx={{ mb: 1 }}>
          <RespStationName variant="h5">{history.stationName}</RespStationName>
          <RespStationName variant="h6" sx={{ lineHeight: 1 }}>{history.kana}</RespStationName>
        </Box>

        <Typography variant="h6" color="gray" sx={{ fontSize: 14 }}>
          {stateNames[history.state]} {("0"+history.date.getHours()).slice(-2)}:{("0"+history.date.getMinutes()).slice(-2)}
        </Typography>
      </Button>
    );
  }
  
  return (
    <Button
      component={Link}
      to={"/station/" + history[0].stationCode}
      variant="outlined"
      color="inherit"
      sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
    >
      <Box sx={{ mb: 1 }}>
        <RespStationName variant="h5">{history[0].stationName}</RespStationName>
        <RespStationName variant="h6" sx={{ lineHeight: 1 }}>{history[0].kana}</RespStationName>
      </Box>

      <Stack direction="column">
        {history.map(hist => (
          <Typography variant="h6" color="gray" sx={{ fontSize: 14 }} key={hist.date.toString()}>
            {stateNames[hist.state]} {("0"+hist.date.getHours()).slice(-2)}:{("0"+hist.date.getMinutes()).slice(-2)}
          </Typography>
        ))}
      </Stack>
    </Button>
  );
};


const OmittedContents = (
  { historyList }
  :{
    historyList: StationHistoryDetail[]
  }
) => {
  if(historyList.length === 0){
    return (
      <></>
    );
  }

  if(historyList.length === 1){
    return (
      <Box sx={{ ml: 2 }}>
        <HistoryContent history={historyList[0]} />
      </Box>
    );
  }

  return (
    <Collapser
      buttonText={
        <Typography variant="h6" sx={{ display: "inline" }}>
          | {historyList.length}駅
        </Typography>
      }
      sx={{ ml: 3 }}
    >
      {historyList.map(history => (
        <Box sx={{ ml: 2 }} key={`${history.date}|${history.state}|${history.stationCode}`}>
          <HistoryContent history={history} />
        </Box>
      ))}
    </Collapser>
  );
};


// 詳細で表示するものとそのまま表示するものを分ける
// そのまま表示する要素のindexを返す
const splitHistoryList = (historyList: StationHistoryDetail[]): (StationHistoryDetail & { idx: number })[] => {
  if(historyList.length <= 3){
    return historyList.map((history, idx) => ({ ...history, idx: idx }));
  }

  let res: (StationHistoryDetail & { idx: number })[] = [{ ...historyList[0], idx: 0 }];
  for(let i = 1; i < historyList.length-1; i++){
    const history = historyList[i];
    if(history.state === RecordState.Get
      || historyList[i-1].railwayCode !== history.railwayCode
      || historyList[i+1].railwayCode !== history.railwayCode
      || historyList[i-1].date.getTime() - history.date.getTime() >= 1000*60*60*24
      || history.date.getTime() - historyList[i+1].date.getTime() >= 1000*60*60*24) res.push({ ...history, idx: i });
  }
  res.push({ ...historyList[historyList.length-1], idx: historyList.length - 1 });
  return res;
};


const History = () => {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timer>();
  const [inputName, setInputName] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchType, setSearchType] = useState("station");
  const [dateFrom, setFromDate] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);

  const historyList = useStationHistoryList((page-1) * rowsPerPage, rowsPerPage, searchName, searchType, dateFrom?.toDate(), dateTo?.toDate());

  const historyListCount = useStationHistoryCount(searchName, searchType, dateFrom?.toDate(), dateTo?.toDate());

  const handleChangeRowsPerPage = (event: SelectChangeEvent) => {
    setRowsPerPage(+event.target.value);
    setPage(1);
  };

  // 500[ms]遅延して検索が更新される
  const handleChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputName(event.target.value);
    const text = event.target.value;
    clearInterval(timeoutId as unknown as number);
    setTimeoutId(
      setTimeout(() => {
        setSearchName(text);
        setPage(1);
      }, 500)
    );
  };


  const CustomPagination = (): JSX.Element => {
    return (
      <BinaryPagination
        page={page}
        count={historyListCount.data!}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[20,50,100,200,1000]}
        onPageChange={(newPage) => setPage(newPage)}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ my: 1 }}
      />
    );
  };


  if(!isAuthenticated){
    return (
      <NotFound />
    );
  }

  if(historyList.isError || historyListCount.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(!historyList.data || historyListCount.data === undefined){
    return (
      <Container>
        <Box>
          <TextField
            id="search name"
            label="search name"
            variant="standard"
            value={inputName}
            sx={{ maxWidth: "50%", mr: 3 }}
            onChange={handleChangeText}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl variant="standard">
            <InputLabel id="history-search-type-label">type</InputLabel>
            <Select
              labelId="history-search-type-label"
              id="history-search-type-label"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              label="type"
            >
              <MenuItem value="station">駅名</MenuItem>
              <MenuItem value="railway">路線名</MenuItem>
              <MenuItem value="company">会社名</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {historyListCount.data !== undefined && <CustomPagination />}
        <Box>
          Loading...
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box>
        <TextField
          id="search name"
          label="search name"
          variant="standard"
          value={inputName}
          sx={{ maxWidth: "50%", mr: 3 }}
          onChange={handleChangeText}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <FormControl variant="standard">
          <InputLabel id="history-search-type-label">type</InputLabel>
          <Select
            labelId="history-search-type-label"
            id="history-search-type-label"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            label="type"
          >
            <MenuItem value="station">駅名</MenuItem>
            <MenuItem value="railway">路線名</MenuItem>
            <MenuItem value="company">会社名</MenuItem>
          </Select>
        </FormControl>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="ja"
          dateFormats={{ year: "YYYY", month: "M月" }}
        >
          <DatePicker
            label="開始日"
            value={dateFrom}
            onChange={(dateFrom) => setFromDate(dateFrom)}
            slotProps={{
              textField: { variant: "standard" },
              toolbar: { toolbarFormat: "YYYY年 M月" },
            }}
            format="YYYY-MM-DD"
            sx={{ display: "inline-block", width: 120, ml: 3 }}
            disableFuture
          />
          <DatePicker
            label="終了日"
            value={dateTo}
            onChange={(dateTo) => setDateTo(dateTo)}
            slotProps={{
              textField: { variant: "standard" },
              toolbar: { toolbarFormat: "YYYY年 M月" },
            }}
            format="YYYY-MM-DD"
            sx={{ display: "inline-block", width: 120,  ml: 3 }}
            disableFuture
          />
        </LocalizationProvider>
      </Box>

      <CustomPagination />

      <Box>
        <CustomLink to="/historyMap">
          <Typography variant="h6" sx={{ fontSize: 14, textAlign: "right" }}>マップを見る</Typography>
        </CustomLink>
      </Box>

      <Box>
        {splitHistoryList(historyList.data).map((item, i, list) => {
          const date = item.date;
          if(!i) console.log(list);
          const isSameDate = i && list[i-1].date.getTime() - date.getTime() < 1000*60*60*24;
          return (
            <Box key={`${date.toString()}|${item.stationCode}|${item.state}`}>
              {/* 省略 */}
              {!!isSameDate && (<OmittedContents historyList={historyList.data.slice(list[i-1].idx+1, item.idx)} />)}
              {/* 日付 */}
              {!isSameDate && (
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {getDateString(date, true, true)}({dayNames[date.getDay()]})
                  ー {aroundDayName(item.date)}
                </Typography>
              )}
              {/* 路線名 */}
              {(!isSameDate || item.railwayCode !== list[i-1].railwayCode) && (
                <Box sx={{ ml: 1 }}>
                  <Button
                    component={Link}
                    to={"/company/" + item.companyCode}
                    color="inherit"
                    sx={{ padding: 0 }}
                  >
                    <Typography variant="h6" sx={{ mr: 1, fontSize: 15, display: "inline-block" }}>
                      {item.railwayCompany}
                    </Typography>
                  </Button>
                  <Button
                    component={Link}
                    to={"/railway/" + item.railwayCode}
                    color="inherit"
                    sx={{ padding: 0 }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        display: "inline-block",
                        textDecoration: "underline",
                        textDecorationColor: "#" + item.railwayColor,
                        textDecorationThickness: 3,
                      }}
                    >
                      {item.railwayName}
                    </Typography>
                  </Button>
                </Box>
              )}
              {/* (同じ駅での履歴が連続して3つ以上ある場合、一部表示されなくなる) */}
              <Box sx={{ ml: 2 }}>
                {(i+1 < list.length && item.stationCode === list[i+1].stationCode &&
                  date.getTime() - list[i+1].date.getTime() < 1000*60*60*24) ? (
                  <HistoryContent history={[item, list[i+1]]}/>
                ) : !(isSameDate && item.stationCode === list[i-1].stationCode) && (
                  <HistoryContent history={item}/>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      <CustomPagination />
    </Container>
  )
};

export default History;
