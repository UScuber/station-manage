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
import { useStationHistoryList, useStationHistoryCount, StationHistoryDetail } from "../api/Api";
import { useAuth } from "../auth/auth";
import { BinaryPagination, CustomLink, RespStationName } from "../components";
import getDateString from "../utils/getDateString";
import NotFound from "./NotFound";
import aroundDayName from "../utils/aroundDayName";


const stateNames = ["乗降", "通過"];
const dayNames = ["日", "月", "火", "水", "木", "金", "土"];


const HistoryContent = (
  { history }
  :{
    history: StationHistoryDetail
  }
): JSX.Element => {
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
};


const History = () => {
  const { isAuthenticated } = useAuth();
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
              onChange={handleChangeSearchType}
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
        <CustomLink to="/historyMap">
          <Typography variant="h6" sx={{ fontSize: 14, textAlign: "right" }}>マップを見る</Typography>
        </CustomLink>
      </Box>

      <Box>
        {historyList.data.map((item, index, list) => {
          const date = item.date;
          const isSameDate = index && list[index-1].date.getTime() - date.getTime() < 1000*60*60*24;
          return (
            <Box key={`${date.toString()}|${item.stationCode}|${item.state}`}>
              {/* 日付 */}
              {!isSameDate && (
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {getDateString(date, true, true)}({dayNames[date.getDay()]})
                  ー {aroundDayName(item.date)}
                </Typography>
              )}
              {/* 路線名 */}
              {(!isSameDate || item.railwayCode !== list[index-1].railwayCode) && (
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
              <Box sx={{ ml: 2 }}>
                <HistoryContent history={item}/>
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
