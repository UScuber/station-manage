import React from "react";
import { useParams } from "react-router-dom";
import { Box, Container } from "@mui/system";
import { Button, CircularProgress, Typography } from "@mui/material";
import { useSendStationGroupStateMutation, useStationGroupInfo, useStationInfo, useStationsInfoByGroupCode } from "./Api";


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
    <Box sx={{ mb: 2 }} border={1} onClick={() => window.location.href = "/station/" + code}>
      <Typography variant="h6" sx={{ color: "gray" }}>駅コード:</Typography>
      <Typography variant="h6" sx={{ mx: 2 }}>{info?.stationCode}</Typography>

      <Typography variant="h6" sx={{ color: "gray" }}>路線名:</Typography>
      <Typography variant="h6" sx={{ mx: 2 }}>{info?.railwayName}</Typography>

      <Typography variant="h6" sx={{ color: "gray" }}>路線運営会社:</Typography>
      <Typography variant="h6" sx={{ mx: 2 }}>{info?.railwayCompany}</Typography>

      <Typography variant="h6">乗降: {info?.getDate?.toString() ?? "なし"}</Typography>
      <Typography variant="h6">通過: {info?.passDate?.toString() ?? "なし"}</Typography>
    </Box>
  );
};

const StationGroupInfo = () => {
  const stationGroupCode = Number(useParams<"stationGroupCode">().stationGroupCode);

  const groupStations = useStationsInfoByGroupCode(stationGroupCode);
  const stationList = groupStations.data;
  const groupStationQuery = useStationGroupInfo(stationGroupCode);
  const groupStationData = groupStationQuery.data;

  const mutation = useSendStationGroupStateMutation();

  const handleSubmit = () => {
    mutation.mutate({
      stationGroupCode: stationGroupCode,
      date: new Date(),
    });
  };


  if(groupStations.isError || groupStationQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(groupStations.isLoading || groupStationQuery.isLoading){
    return (
      <Container>
        Loading...
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h3" sx={{ mb: 2 }}>{groupStationData?.stationName}</Typography>
      <Typography variant="h6">立ち寄り: {groupStationData?.date?.toString() ?? "なし"}</Typography>
      <Button variant="outlined" onClick={handleSubmit} sx={{ textAlign: "center", mb: 2 }}>
        立ち寄り
      </Button>
      <Box>
        {stationList?.map((item) => (
          <StationItem key={item.stationCode} code={item.stationCode} />
        ))}
      </Box>
    </Container>
  );
};

export default StationGroupInfo;
