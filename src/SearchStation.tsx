import React, { useEffect, useRef, useState } from "react";
import { Coordinate } from "./Api";
import { Box, Button, CircularProgress, Container, Typography } from "@mui/material";

const SearchStation = () => {
  const [isAvailable, setAvailable] = useState(false);
  const [position, setPosition] = useState<Coordinate>();
  const isFirstRef = useRef(true);

  useEffect(() => {
    isFirstRef.current = false;
    if("geolocation" in navigator){
      setAvailable(true);
    }
  }, [isAvailable]);

  const getCurrentPosition = () => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;
      setPosition({ lat: latitude, lng: longitude });
    });
  };

  if(isFirstRef.current){
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
    </Container>
  );
};

export default SearchStation;
