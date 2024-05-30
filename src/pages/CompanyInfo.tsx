import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import { Railway, useCompanyInfo, useRailPathByCompanyCode, useRailwayProgress, useRailwaysInfoByCompanyCode, useStationsInfoByCompanyCode } from "../api/Api";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Leaflet from "leaflet";
import { CircleProgress, CustomLink, StationMapGeojson } from "../components";
import { useAuth } from "../auth/auth";


const FitMapZoom = (
  { positions }
  :{
    positions: { lat: number, lng: number}[],
  }
) => {
  const map = useMap();
  const [first, setFirst] = useState(true);
  if(first){
    const group = Leaflet.featureGroup(positions.map(pos => Leaflet.marker(pos)));
    map.fitBounds(group.getBounds());
    setFirst(false);
  }
  return null;
};

const RailwayItem = ({ info }: { info: Railway }): JSX.Element => {
  const { isAuthenticated } = useAuth();
  const railwayProgressQuery = useRailwayProgress(isAuthenticated ? info.railwayCode : undefined);
  const railwayProgress = railwayProgressQuery.data;

  return (
    <Button
      component={Link}
      to={"/railway/" + info.railwayCode}
      variant="outlined"
      color="inherit"
      sx={{
        display: "block",
        mb: 0.5,
        bgcolor: (isAuthenticated && railwayProgress && railwayProgress.getOrPassStationNum === railwayProgress.stationNum ? "access.main" : "none"),
      }}
    >
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            sx={{
              display: "inline-block",
              mr: 2,
              textDecoration: "underline",
              textDecorationColor: "#" + info.railwayColor,
              textDecorationThickness: 3,
            }}
          >
            {info.railwayName}
          </Typography>
          {isAuthenticated && railwayProgress && (<CircleProgress size={25} progress={railwayProgress} />)}
        </Box>
        <Typography variant="h6" sx={{ fontSize: 16 }}>{info.formalName}</Typography>
      </Box>
    </Button>
  );
};

const CompanyInfo = () => {
  const companyCode = Number(useParams<"companyCode">().companyCode);

  const companyQuery = useCompanyInfo(companyCode);
  const info = companyQuery.data;

  const railwaysQuery = useRailwaysInfoByCompanyCode(companyCode);
  const railwayList = railwaysQuery.data;

  const stationsQuery = useStationsInfoByCompanyCode(companyCode);
  const stationList = stationsQuery.data;

  const railwayPathQuery = useRailPathByCompanyCode(companyCode);
  const railwayPath = railwayPathQuery.data;

  if(companyQuery.isError || railwaysQuery.isError || stationsQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(!info || !railwayList || !stationList){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  const centerPosition = stationList.reduce((totPos, item) => ({
    lat: totPos.lat + item.latitude / stationList.length,
    lng: totPos.lng + item.longitude / stationList.length,
  }), { lat: 0, lng: 0 });

  const stationsPositionMap = (() => {
    let codeMap: { [key: number]: { lat: number, lng: number } } = {};
    stationList.forEach(item => {
      codeMap[item.stationCode] = { lat: item.latitude, lng: item.longitude };
    });
    return codeMap;
  })();

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3">{info.companyName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 16, mb: 0.5 }}>{info.formalName}</Typography>
        <CustomLink to="/company">
          <Typography variant="h6" sx={{ fontSize: 14 }}>会社一覧</Typography>
        </CustomLink>
      </Box>
      <Box>
        {railwayList.map(item => (
          <RailwayItem info={item} key={item.railwayCode} />
        ))}
      </Box>

      <MapContainer center={centerPosition} zoom={10} style={{ height: "80vh" }}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {railwayPath && (
          <StationMapGeojson railwayPath={railwayPath} stationList={stationList} />
        )}
        <FitMapZoom positions={Object.keys(stationsPositionMap).map(key => stationsPositionMap[Number(key)])} />
      </MapContainer>
    </Container>
  );
};

export default CompanyInfo;
