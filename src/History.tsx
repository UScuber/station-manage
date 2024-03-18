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
  TextField,
  Typography,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { StationHistory, useStationInfo, useStationHistoryList, useStationHistoryCount } from "./Api";
import BinaryPagination from "./components/BinaryPagination";
import getDateString from "./utils/getDateString";


const stateNames = ["乗降", "通過"];

const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

const aroundDayName = (date: Date): string => {
  let past = date;
  let now = new Date();
  past = new Date(past.getFullYear(), past.getMonth(), past.getDate());
  now = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if(past.getTime() === now.getTime()){
    return "今日";
  }
  past.setDate(past.getDate() + 1);
  if(past.getTime() === now.getTime()){
    return "昨日";
  }
  past.setDate(past.getDate() + 1);
  if(past.getTime() === now.getTime()){
    return "おととい";
  }
  // 1 week
  past.setDate(past.getDate() - 2);
  past.setDate(past.getDate() - past.getDay());
  now.setDate(now.getDate() - now.getDay());
  if(past.getTime() === now.getTime()){
    return "今週";
  }
  past.setDate(past.getDate() + 7);
  if(past.getTime() === now.getTime()){
    return "先週";
  }
  past.setDate(past.getDate() - 7);
  past.setDate(1);
  now.setDate(1);
  if(past.getTime() === now.getTime()){
    return "今月";
  }
  past.setMonth(past.getMonth() + 1);
  if(past.getTime() === now.getTime()){
    return "先月";
  }
  past.setMonth(past.getMonth() - 1);
  if(past.getFullYear() === now.getFullYear()){
    return "今年";
  }
  if(past.getFullYear() + 1 === now.getFullYear()){
    return "去年";
  }
  if(past.getFullYear() + 2 === now.getFullYear()){
    return "おととし";
  }
  return "";
};

const HistoryContent = (
  { history }
  :{
    history: StationHistory
  }
): JSX.Element => {
  const station = useStationInfo(history.stationCode);
  const info = station.data;

  if(station.isLoading){
    return (
      <></>
    );
  }

  return (
    <Button
      component={Link}
      to={"/station/" + info?.stationCode}
      variant="outlined"
      color="inherit"
      sx={{ display: "block", mb: 0.5, textTransform: "none" }}
    >
      <Box sx={{ mb: 1 }}>
        <Typography variant="h5">{info?.stationName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 12, lineHeight: 1 }}>{info?.kana}</Typography>
      </Box>

      <Typography variant="h6" sx={{ mr: 1, fontSize: 15, display: "inline-block" }}>{info?.railwayCompany}</Typography>
      <Typography
        variant="h6"
        sx={{
          display: "inline-block",
          textDecoration: "underline",
          textDecorationColor: "#" + info?.railwayColor,
          textDecorationThickness: 3
        }}
      >
        {info?.railwayName}
      </Typography>

      <Typography variant="h6">{stateNames[history.state]}: {("0"+history.date.getHours()).slice(-2)}:{("0"+history.date.getMinutes()).slice(-2)}</Typography>
    </Button>
  );
};


const History = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timer>();
  const [inputName, setInputName] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchType, setSearchType] = useState("station");

  const historyList = useStationHistoryList((page-1) * rowsPerPage, rowsPerPage, searchName, searchType);

  const historyListCount = useStationHistoryCount(searchName, searchType);

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: SelectChangeEvent) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  // 500[ms]遅延して検索が更新される
  const handleChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputName(event.target.value);
    const text = event.target.value;
    clearInterval(timeoutId);
    setTimeoutId(
      setTimeout(() => setSearchName(text), 500)
    );
  };

  const handleChangeSearchType = (event: SelectChangeEvent) => {
    setSearchType(event.target.value);
  };

  const CustomPagination = (): JSX.Element => {
    return (
      <BinaryPagination
        page={page}
        count={historyListCount.data!}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10,25,50,100]}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ my: 1 }}
      />
    );
  };


  if(historyList.isError || historyListCount.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(historyList.isLoading || historyListCount.isLoading){
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
              onChange={handleChangeSearchType}
              label="type"
            >
              <MenuItem value="station">駅名</MenuItem>
              <MenuItem value="railway">路線名</MenuItem>
              <MenuItem value="company">会社名</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {!historyListCount.isLoading && <CustomPagination />}
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
            onChange={handleChangeSearchType}
            label="type"
          >
            <MenuItem value="station">駅名</MenuItem>
            <MenuItem value="railway">路線名</MenuItem>
            <MenuItem value="company">会社名</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <CustomPagination />

      <Box>
        {historyList.data?.map((item, index, list) => {
          const date = item.date;
          if(!index || list[index-1].date.getDay() !== date.getDay()){
            return (
              <Box key={`${date.toString()}|${item.stationCode}`}>
                <Typography variant="h6">
                  {getDateString(date, true, true)}({dayNames[date.getDay()]})
                  ー {aroundDayName(item.date)}
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <HistoryContent history={item}/>
                </Box>
              </Box>
            );
          }
          return (
            <Box key={`${date.toString()}|${item.stationCode}`} sx={{ ml: 2 }}>
              <HistoryContent history={item}/>
            </Box>
          );
        })}
      </Box>

      <CustomPagination />
    </Container>
  )
};

export default History;
