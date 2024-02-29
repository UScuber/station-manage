import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { Railway, useRailwaysInfoByPrefCode, useStationsInfoByPrefCode } from "./Api";
import { CircleMarker, FeatureGroup, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Leaflet from "leaflet";


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
  return (
    <Button
      component={Link}
      to={"/railway/" + info.railwayCode}
      variant="outlined"
      color="inherit"
      sx={{ display: "block", mb: 0.5, textTransform: "none" }}
    >
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{
          textDecoration: "underline",
          textDecorationColor: "#" + info.railwayColor,
          textDecorationThickness: 3
        }}>
          {info.railwayName}
        </Typography>
        <Typography variant="h6" sx={{ fontSize: 16 }}>{info.formalName}</Typography>
      </Box>
    </Button>
  );
};

const PrefectureInfo = () => {
  const prefCode = Number(useParams<"prefCode">().prefCode);

  const railwaysQuery = useRailwaysInfoByPrefCode(prefCode);
  const railwayList = railwaysQuery.data;

  const stationsQuery = useStationsInfoByPrefCode(prefCode);
  const stationList = stationsQuery.data;

  if(railwaysQuery.isError || stationsQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(railwaysQuery.isLoading || stationsQuery.isLoading){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  const centerPosition = stationList?.reduce((totPos, item) => ({
    lat: totPos.lat + item.latitude / stationList.length,
    lng: totPos.lng + item.longitude / stationList.length,
  }), { lat: 0, lng: 0 });

  const stationsPositionMap = (() => {
    let codeMap: { [key: number]: { lat: number, lng: number } } = {};
    stationList?.forEach(item => {
      codeMap[item.stationCode] = { lat: item.latitude, lng: item.longitude };
    });
    return codeMap;
  })();

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3">{stationList && stationList[0].prefName}</Typography>
      </Box>
      <Box>
        {railwayList?.map(item => (
          <RailwayItem info={item} key={item.railwayCode} />
        ))}
      </Box>

      <MapContainer center={centerPosition} zoom={10} style={{ height: "80vh" }}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stationList?.map(item => (
          <FeatureGroup pathOptions={{ color: "#" + (item.railwayColor ?? "808080") }} key={item.stationCode}>
            <Popup>
              <Box sx={{ textAlign: "center" }}>
                <Link to={"/railway/" + item.railwayCode}>{item.railwayName}</Link>
              </Box>
            </Popup>
            {item.left.map(code => (
              <Polyline
                key={code}
                weight={8}
                positions={[stationsPositionMap[item.stationCode], stationsPositionMap[code]]}
              />
            ))}
          </FeatureGroup>
        ))}
        {stationList?.map(item => (
          <CircleMarker
            center={[item.latitude, item.longitude]}
            pathOptions={{ color: "black", weight: 2, fillColor: "white", fillOpacity: 1 }}
            radius={6}
            key={item.stationCode}
          >
            <Popup>
              <Box sx={{ textAlign: "center" }}>
                <Link to={"/station/" + item.stationCode}>{item.stationName}</Link>
              </Box>
            </Popup>
          </CircleMarker>
        ))}
        <FitMapZoom positions={Object.keys(stationsPositionMap).map(key => stationsPositionMap[Number(key)])} />
      </MapContainer>
      <Toolbar />
    </Container>
  );
};

export default PrefectureInfo;
