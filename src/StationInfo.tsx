import React from "react";
import { useParams } from "react-router-dom";
import { useStationInfo, useStationState } from "./Api";
import { Box, CircularProgress, Container, Toolbar, Typography } from "@mui/material";

const StationInfo = () => {
  const stationCode = Number(useParams<"stationCode">().stationCode);

  const station = useStationInfo(stationCode);
  const info = station.data;

  const stationState = useStationState(stationCode);
  const state = stationState.data;
  const getOnDate = state?.getOnDate ? state.getOnDate.toString() : "なし";
  const getOffDate = state?.getOffDate ? state.getOffDate.toString() : "なし";
  const passDate = state?.passDate ? state.passDate.toString() : "なし";

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

          <Typography variant="h6" sx={{ color: "gray" }}>最終アクセス:</Typography>
          <Box sx={{ mx: 2 }}>
            <Typography variant="h6">乗車: {getOnDate}</Typography>
            <Typography variant="h6">降車: {getOffDate}</Typography>
            <Typography variant="h6">通過: {passDate}</Typography>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default StationInfo;
