import { Link } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { useStationHistoryListAndInfo } from "./Api";
import "leaflet/dist/leaflet.css";
import Leaflet from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";


const DefaultIcon = Leaflet.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [13, 40],
  popupAnchor: [0, -35],
});
Leaflet.Marker.prototype.options.icon = DefaultIcon;

const HistoryMap = () => {
  const historyListQuery = useStationHistoryListAndInfo();
  const historyList = historyListQuery.data;

  if(historyListQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(historyListQuery.isLoading){
    return (
      <Container>
        Loading ...
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <MapContainer center={[36.265185, 138.126471]} zoom={6} style={{ height: "90vh" }}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {historyList?.map(info => (
          <CircleMarker
            center={[info.latitude, info.longitude]}
            pathOptions={{ color: "black", weight: 2, fillColor: "white", fillOpacity: 1 }}
            radius={6}
            key={`${info.stationCode}|${info.date}|${info.state}`}
          >
            <Popup>
              <Box sx={{ textAlign: "center" }}>
                <Link to={"/station/" + info.stationCode}>{info.stationName}</Link>
              </Box>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </Container>
  );
};

export default HistoryMap;
