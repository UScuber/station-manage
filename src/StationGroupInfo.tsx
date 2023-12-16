import React from "react";
import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/system";
import { useStationInfo, useStationsInfoByGroupCode } from "./Api";
import { CircularProgress, Typography } from "@mui/material";


type Props = {
  code: number,
};

const StationItem: React.FC<Props> = (props) => {
  const { code } = props;
  const station = useStationInfo(code);
  const info = station.data;

  if(station.isLoading){
    return (
      <Box></Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ color: "gray" }}>路線名:</Typography>
      <Typography variant="h6" sx={{ mx: 2 }}>{info?.railwayName}</Typography>

      <Typography variant="h6" sx={{ color: "gray" }}>路線運営会社:</Typography>
      <Typography variant="h6" sx={{ mx: 2 }}>{info?.railwayCompany}</Typography>
    </Box>
  );
};

const StationGroupInfo = () => {
  const stationGroupCode = Number(useParams<"stationGroupCode">().stationGroupCode);

  const groupStation = useStationsInfoByGroupCode(stationGroupCode);
  const stationList = groupStation.data;

  if(groupStation.isLoading){
    return (
      <Container>
        Loading...
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h3" sx={{ mb: 2 }}>{stationList && (stationList[0]?.stationName)}</Typography>
      <Box>
        {stationList?.map((item, index) => (
          <StationItem key={index} code={item.stationCode} />
        ))}
      </Box>
    </Container>
  );
};

export default StationGroupInfo;
