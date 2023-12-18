import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Toolbar,
  Typography
} from "@mui/material";
import { StationHistory, useStationInfo, useStationHistoryList } from "./Api";

type Props = {
  history: StationHistory,
};

const stateNames = ["乗降", "通過"];

const HistoryContent: React.FC<Props> = (props) => {
  const { history } = props;
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
      sx={{ display: "block", mb: 3, textTransform: "none" }}
    >
      <Typography variant="h4" sx={{ mb: 1 }}>{info?.stationName}</Typography>

      <Typography variant="h6" sx={{ color: "gray", mx: 2 }}>駅コード:</Typography>
      <Typography variant="h6" sx={{ mx: 4 }}>{info?.stationCode}</Typography>

      <Typography variant="h6" sx={{ color: "gray", mx: 2 }}>路線名:</Typography>
      <Typography variant="h6" sx={{ mx: 4 }}>{info?.railwayName}</Typography>

      <Typography variant="h6" sx={{ mx: 2 }}>{stateNames[history?.state]}: {history?.date.toString()}</Typography>
    </Button>
  );
};


const History = () => {
  const [page, setPage] = useState(0);
  const [contentsNum, setContentsNum] = useState(20);

  const historyList = useStationHistoryList(page * contentsNum, contentsNum);

  const handleNextPage = () => {
    setPage(page + 1);
  };
  const handlePrevPage = () => {
    setPage(Math.max(page - 1, 0));
  };

  if(historyList.isLoading){
    return (
      <Container>
        Loading ...
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Box>
        {historyList.data?.map((item, index) => (
          <HistoryContent key={index} history={item}/>
        ))}
      </Box>
      <Toolbar />
      <Box>
        <Button onClick={() => handlePrevPage()}>
          Prev
        </Button>
        <Button onClick={() => handleNextPage()}>
          Next
        </Button>
      </Box>
    </Container>
  )
};

export default History;
