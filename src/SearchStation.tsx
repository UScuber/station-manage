import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Coordinate, useSearchKNearestStationGroups, useStationsInfoByGroupCode } from "./Api";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography
} from "@mui/material";

type Props = {
  code: number,
  distance: number | undefined,
};

const StationGroupInfo: React.FC<Props> = (props) => {
  const { code, distance } = props;
  const stations = useStationsInfoByGroupCode(code);
  const infos = stations.data;

  if(stations.isLoading){
    return (
      <Box sx={{ mb: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      {distance && (
        <Typography sx={{ fontSize: 18 }}>距離: {distance.toFixed(3)}[km]</Typography>
      )}
      {infos?.map(station => (
        <Button
          component={Link}
          to={"/station/" + station.stationCode}
          variant="outlined"
          color="inherit"
          key={station.stationCode}
          sx={{ display: "block", mb: 1, textTransform: "none" }}
        >
          <Typography variant="h6">駅名: {station.stationName}</Typography>
          <Typography variant="h6">路線名: {station.railwayName}</Typography>
          <Typography variant="h6">路線運営会社: {station.railwayCompany}</Typography>
        </Button>
      ))}
    </Box>
  );
};

const SearchStation = () => {
  const [isAvailable, setAvailable] = useState(false);
  const [position, setPosition] = useState<Coordinate>();
  const isFirstRef = useRef(true);

  const nearestStationGroups = useSearchKNearestStationGroups(position, 5);
  const groupStations = nearestStationGroups.data;

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


  if(nearestStationGroups.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(isFirstRef.current || nearestStationGroups.isLoading){
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
      {groupStations?.map(item => (
        <StationGroupInfo
          key={item.stationGroupCode}
          code={item.stationGroupCode}
          distance={item.distance}
        />
      ))}
    </Container>
  );
};

export default SearchStation;
