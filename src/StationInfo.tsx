import React from "react";
import { useParams } from "react-router-dom";
import { useStationInfo } from "./Api";
import { Box, CircularProgress, Container, Toolbar, Typography } from "@mui/material";

const StationInfo = () => {
  const { stationCode } = useParams<"stationCode">();

  const station = useStationInfo(Number(stationCode));
  const info = station.data;

  if(station.isLoading){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <>
      <Toolbar />
      <Container>
        <Typography variant="h4">{info?.stationName}</Typography>
        <Box>
          <Typography variant="h6">駅コード: {info?.stationCode}</Typography>
          <p>路線名: {info?.railwayName}</p>
          <p>路線運営会社: {info?.railwayCompany}</p>
          <p>緯度: {info?.latitude}</p>
          <p>経度: {info?.longitude}</p>
        </Box>
      </Container>
    </>
  );
};

export default StationInfo;
