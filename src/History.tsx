import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  SelectChangeEvent,
  Typography
} from "@mui/material";
import { StationHistory, useStationInfo, useStationHistoryList, useStationHistoryCount } from "./Api";
import BinaryPagination from "./components/BinaryPagination";


const stateNames = ["乗降", "通過"];

const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

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
  
  const date = new Date(history.date);

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

      <Typography variant="h6" sx={{ color: "gray", display: "inline-block" }}>路線: </Typography>
      <Typography variant="h6" sx={{ mx: 1, fontSize: 15, display: "inline-block" }}>{info?.railwayCompany}</Typography>
      <Typography variant="h6" sx={{ display: "inline-block" }}>{info?.railwayName}</Typography>

      <Typography variant="h6">{stateNames[history.state]}: {("0"+date.getHours()).slice(-2)}:{("0"+date.getMinutes()).slice(-2)}</Typography>
    </Button>
  );
};


const History = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const historyList = useStationHistoryList((page-1) * rowsPerPage, rowsPerPage);

  const historyListCount = useStationHistoryCount();

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: SelectChangeEvent) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
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
        {!historyListCount.isLoading && <CustomPagination />}
        Loading ...
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <CustomPagination />

      <Box>
        {historyList.data?.map((item, index, list) => {
          const date = new Date(item.date);
          if(!index || new Date(list[index-1].date).getDay() !== new Date(item.date).getDay()){
            return (
              <Box key={`${date.toString()}|${item.stationCode}`}>
                <Typography variant="h6">
                  {date.getFullYear()}-{("0"+date.getMonth()+1).slice(-2)}-{("0"+date.getDate()).slice(-2)}({dayNames[date.getDay()]})
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
