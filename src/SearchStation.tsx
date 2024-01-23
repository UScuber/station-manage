import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Coordinate, useSearchKNearestStationGroups, useStationsInfoByGroupCode } from "./Api";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography
} from "@mui/material";


const StationGroupInfo = (
  { code, distance }
  :{
    code: number,
    distance: number | undefined,
  }
): JSX.Element => {
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
      {infos?.map(info => (
        <Button
          component={Link}
          to={"/station/" + info.stationCode}
          variant="outlined"
          color="inherit"
          key={info.stationCode}
          sx={{ display: "block", mb: 1, textTransform: "none" }}
        >
          <Typography variant="h6">{info?.stationName}</Typography>
          <Typography variant="h6" sx={{ fontSize: 12, lineHeight: 1 }}>{info?.kana}</Typography>

          <Typography variant="h6" sx={{ fontSize: 15, display: "inline-block" }}>{info?.railwayCompany}</Typography>
          <Typography variant="h6" sx={{ mx: 1, display: "inline-block" }}>{info?.railwayName}</Typography>
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
          <Button variant="outlined" onClick={() => getCurrentPosition()}>Search</Button>
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
