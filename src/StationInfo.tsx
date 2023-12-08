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
        <Typography variant="h3" sx={{ mb: 2 }}>{info?.stationName}</Typography>
        <Box>
          <Typography variant="h6" sx={{ color: "gray" }}>駅コード:</Typography>
          <Typography variant="h6" sx={{ mx: 2 }}>{info?.stationCode}</Typography>

          <Typography variant="h6" sx={{ color: "gray" }}>路線名:</Typography>
          <Typography variant="h6" sx={{ mx: 2 }}>{info?.railwayName}</Typography>

          <Typography variant="h6" sx={{ color: "gray" }}>路線運営会社:</Typography>
          <Typography variant="h6" sx={{ mx: 2 }}>{info?.railwayCompany}</Typography>

          <Typography variant="h6" sx={{ color: "gray" }}>座標:</Typography>
          <Typography variant="h6" sx={{ mx: 2 }}>緯度:{info?.latitude}, 経度:{info?.longitude}</Typography>
        </Box>
      </Container>
    </>
  );
};

export default StationInfo;
