import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Coordinate, useSearchKNearestStationGroups, useStationsInfoByGroupCode } from "./Api";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Typography,
} from "@mui/material";
import AroundTime from "./components/AroundTime";


const StationGroupInfo = (
  { code, distance }
  :{
    code: number,
    distance: number | undefined,
  }
): JSX.Element => {
  const stations = useStationsInfoByGroupCode(code);
  const infos = stations.data;

  if(stations.isError){
    return (
      <Typography variant="h5">Error</Typography>
    );
  }

  if(stations.isLoading){
    return (
      <Box sx={{ mb: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      {infos && (
        <Box sx={{ mb: 0.5 }}>
          <Button
            component={Link}
            to={"/stationGroup/" + code}
            color="inherit"
            sx={{ display: "inline-block", textTransform: "none", padding: 0 }}
          >
            <Typography variant="h6" sx={{ fontSize: 22, lineHeight: 1.3 }}>{infos[0].stationName}</Typography>
            <Typography variant="h6" sx={{ fontSize: 12, lineHeight: 1 }}>{infos[0].kana}</Typography>
          </Button>
        </Box>
      )}
      {distance && (
        <Typography variant="h6" sx={{ fontSize: 18 }}>{distance.toFixed(3)}[km]</Typography>
      )}
      {infos?.map(info => (
        <Button
          component={Link}
          to={"/station/" + info.stationCode}
          variant="outlined"
          color="inherit"
          key={info.stationCode}
          sx={{ display: "block", mb: 1, ml: 1, textTransform: "none" }}
        >
          <Typography variant="h6" sx={{ fontSize: 15, display: "inline-block" }}>{info?.railwayCompany}</Typography>
          <Typography
            variant="h6"
            sx={{
              mx: 1,
              display: "inline-block",
              textDecoration: "underline",
              textDecorationColor: "#" + info?.railwayColor,
              textDecorationThickness: 3
            }}
          >
            {info?.railwayName}
          </Typography>

          <Typography variant="h6" sx={{ color: "gray", fontSize: 16 }}>乗降: <AroundTime date={info?.getDate} invalidMsg="なし" fontSize={16} /></Typography>
          <Typography variant="h6" sx={{ color: "gray", fontSize: 16 }}>通過: <AroundTime date={info?.passDate} invalidMsg="なし" fontSize={16} /></Typography>
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
    }, undefined, { timeout: 3000 });
  };

  const handlePosSearchButton = () => {
    getCurrentPosition();
    // watch
    const watchId = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setPosition({ lat: latitude, lng: longitude });
      },
      undefined,
      { enableHighAccuracy: true, timeout: 3000 }
    );
    setTimeout(() => navigator.geolocation.clearWatch(watchId), 3000);
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
        <Box sx={{ mb: 1 }}>
          <Button variant="outlined" onClick={handlePosSearchButton}>Search</Button>
          <Typography variant="h6" sx={{ fontSize: 14 }}>緯度: {position?.lat}</Typography>
          <Typography variant="h6" sx={{ fontSize: 14 }}>経度: {position?.lng}</Typography>
        </Box>
      )}

      <Typography variant="h6">List</Typography>
      <Divider sx={{ mb: 1 }} light />
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
