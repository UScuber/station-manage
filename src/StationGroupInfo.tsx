import React from "react";
import { Link, useParams } from "react-router-dom";
import { Box, Container } from "@mui/system";
import { Button, CircularProgress, ListItemText, Typography } from "@mui/material";
import { Station, useSendStationGroupStateMutation, useStationGroupInfo, useStationsInfoByGroupCode } from "./Api";


const StationItem: React.FC<{ info: Station }> = (props) => {
  const { info } = props;

  return (
    <Button
      component={Link}
      to={"/station/" + info.stationCode}
      variant="outlined"
      color="inherit"
      sx={{ display: "block", mb: 3, textTransform: "none" }}
    >
      <Typography variant="h6" sx={{ color: "gray" }}>駅コード:</Typography>
      <Typography variant="h6" sx={{ mx: 2 }}>{info?.stationCode}</Typography>

      <Typography variant="h6" sx={{ color: "gray" }}>路線運営会社:</Typography>
      <Typography variant="h6" sx={{ mx: 2 }}>{info?.railwayCompany}</Typography>

      <Typography variant="h6" sx={{ color: "gray" }}>路線名:</Typography>
      <Typography variant="h6" sx={{ mx: 2 }}>{info?.railwayName}</Typography>

      <Typography variant="h6">乗降: {info?.getDate?.toString() ?? "なし"}</Typography>
      <Typography variant="h6">通過: {info?.passDate?.toString() ?? "なし"}</Typography>
    </Button>
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
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3">{groupStationData?.stationName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 16, mb: 1 }}>{groupStationData?.kana}</Typography>
        <Typography variant="h6">{groupStationData?.prefName}</Typography>
      </Box>
      <Typography variant="h6">立ち寄り: {groupStationData?.date?.toString() ?? "なし"}</Typography>
      <Button variant="outlined" onClick={handleSubmit} sx={{ mb: 2 }}>
        <ListItemText primary="立ち寄り" />
      </Button>
      <Box>
        {stationList?.map((item) => (
          <StationItem key={item.stationCode} info={item} />
        ))}
      </Box>
    </Container>
  );
};

export default StationGroupInfo;
