import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  TablePagination,
  Typography
} from "@mui/material";
import { StationHistory, useStationInfo, useStationHistoryList, useStationHistoryCount } from "./Api";

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
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const historyList = useStationHistoryList(page * rowsPerPage, rowsPerPage);

  const historyListCount = useStationHistoryCount();

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const Pagination = (): JSX.Element => {
    return (
      <TablePagination
        component="div"
        count={historyListCount.data!}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10,25,50,100,200,500]}
      />
    );
  };

  if(historyList.isLoading){
    return (
      <Container>
        {!historyListCount.isLoading && <Pagination />}
        Loading ...
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Pagination />

      <Box>
        {historyList.data?.map((item, index) => (
          <HistoryContent key={index} history={item}/>
        ))}
      </Box>

      <Pagination />
    </Container>
  )
};

export default History;
