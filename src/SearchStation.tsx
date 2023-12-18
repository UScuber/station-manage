import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Coordinate, useSearchNearestStationGroup, useStationsInfoByGroupCode } from "./Api";
import { Box, Button, CircularProgress, Container, Typography } from "@mui/material";

const SearchStation = () => {
  const [isAvailable, setAvailable] = useState(false);
  const [position, setPosition] = useState<Coordinate>();
  const isFirstRef = useRef(true);

  const nearestStationGroup = useSearchNearestStationGroup(position);
  const groupStation = nearestStationGroup.data;

  const stations = useStationsInfoByGroupCode(groupStation?.stationGroupCode);
  const infos = stations.data;

  const getCurrentPosition = () => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setPosition({ lat: latitude, lng: longitude });
    });
  };

  useEffect(() => {
    isFirstRef.current = false;
    if("geolocation" in navigator){
      getCurrentPosition();
      setAvailable(true);
    }
  }, []);

  if(isFirstRef.current || nearestStationGroup.isLoading || stations.isLoading){
    return (
      <Container>
        Loading...
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      {!isAvailable && <p>Geolocation is not available.</p>}
      {isAvailable && (
        <Box>
          <Button onClick={() => getCurrentPosition()}>Search</Button>
          <Typography variant="h6">緯度: {position?.lat}</Typography>
          <Typography variant="h6">経度: {position?.lng}</Typography>
        </Box>
      )}
      <Typography variant="h6">List</Typography>
      {infos?.map((station, index) => (
        <Button
          component={Link}
          to={"/station/" + station.stationCode}
          variant="outlined"
          color="inherit"
          key={index}
          sx={{ display: "block", mb: 2, textTransform: "none" }}
        >
          <Typography variant="h6">駅名: {station.stationName}</Typography>
          <Typography variant="h6">路線名: {station.railwayName}</Typography>
          <Typography variant="h6">路線運営会社: {station.railwayCompany}</Typography>
        </Button>
      ))}
    </Container>
  );
};

export default SearchStation;
