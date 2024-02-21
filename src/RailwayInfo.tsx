import { Link, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { Station, useRailwayInfo, useStationsInfoByRailwayCode } from "./Api";
import AroundTime from "./components/AroundTime";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Leaflet from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = Leaflet.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [13, 40],
  popupAnchor: [0, -35],
});
Leaflet.Marker.prototype.options.icon = DefaultIcon;


const StationItem = (
  { info }
  :{
    info: Station,
  }
): JSX.Element => {
  return (
    <Button
      component={Link}
      to={"/station/" + info.stationCode}
      variant="outlined"
      color="inherit"
      sx={{ display: "block", mb: 0.5, textTransform: "none" }}
    >
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6">{info?.stationName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 10, lineHeight: 1 }}>{info?.kana}</Typography>
      </Box>

      <Typography variant="h6" sx={{ fontSize: 14 }}>乗降:<AroundTime date={info?.getDate} invalidMsg="なし" fontSize={14} /></Typography>
      <Typography variant="h6" sx={{ fontSize: 14 }}>通過:<AroundTime date={info?.passDate} invalidMsg="なし" fontSize={14} /></Typography>
    </Button>
  );
};

const RailwayInfo = () => {
  const railwayCode = Number(useParams<"railwayCode">().railwayCode);

  const railway = useRailwayInfo(railwayCode);
  const stationsQuery = useStationsInfoByRailwayCode(railwayCode);

  const info = railway.data;
  const stationList = stationsQuery.data;

  if(railway.isError || stationsQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    )
  }

  if(railway.isLoading || stationsQuery.isLoading){
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
        <Typography variant="h3" sx={{ lineHeight: 1 }}>{info?.railwayName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 16 }}>{info?.railwayKana}</Typography>
      </Box>
      <Box>
        {stationList?.map(item => (
          <StationItem key={item.stationCode} info={item} />
        ))}
      </Box>

      <MapContainer center={centerPosition} zoom={8} style={{ height: "50vh" }}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stationList?.map(item => (
          <Marker position={[item.latitude, item.longitude]}>
            <Popup>
              <Box sx={{ textAlign: "center" }}>
                <Link to={"/station/" + item.stationCode}>{item.stationName}</Link>
              </Box>
            </Popup>
          </Marker>
        ))}
        {stationList?.map(item => (
          item.left.map(code => (
            <Polyline pathOptions={{ color: "#" + info?.railwayColor ?? "808080" }} positions={[stationsPositionMap[item.stationCode], stationsPositionMap[code]]} />
          ))
        ))}
      </MapContainer>
      <Toolbar />
    </Container>
  )
};

export default RailwayInfo;
