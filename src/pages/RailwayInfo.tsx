import { Link, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  LinearProgress,
  Typography,
} from "@mui/material";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Leaflet from "leaflet";
import {
  Station,
  useLatestStationHistory,
  useRailPath,
  useRailwayInfo,
  useRailwayProgress,
  useStationsInfoByRailwayCode,
} from "../api/Api";
import { useAuth } from "../auth/auth";
import { AroundTime, CustomLink, StationMapGeojson } from "../components";


const FitMapZoom = (
  { positions }
  :{
    positions: { lat: number, lng: number}[],
  }
) => {
  const map = useMap();
  const group = Leaflet.featureGroup(positions.map(pos => Leaflet.marker(pos)));
  map.fitBounds(group.getBounds());
  return null;
};

const StationItem = ({ info, isAuthenticated }: { info: Station, isAuthenticated: boolean }): JSX.Element => {
  const latestDateQuery = useLatestStationHistory(isAuthenticated ? info.stationCode : undefined);
  const latestDate = latestDateQuery.data;

  return (
    <Button
      component={Link}
      to={"/station/" + info.stationCode}
      variant="outlined"
      color="inherit"
      sx={{
        display: "block",
        mb: 0.5,
        bgcolor: (latestDate?.getDate || latestDate?.passDate) ? "access.main" : "none",
      }}
    >
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6">{info.stationName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 10, lineHeight: 1 }}>{info.kana}</Typography>
      </Box>

      {isAuthenticated && (<>
        <Typography variant="h6" sx={{ fontSize: 14 }}>乗降:<AroundTime date={latestDate?.getDate} invalidMsg="なし" fontSize={14} /></Typography>
        <Typography variant="h6" sx={{ fontSize: 14 }}>通過:<AroundTime date={latestDate?.passDate} invalidMsg="なし" fontSize={14} /></Typography>
      </>)}
    </Button>
  );
};

const RailwayInfo = () => {
  const railwayCode = Number(useParams<"railwayCode">().railwayCode);
  const { isAuthenticated } = useAuth();

  const railway = useRailwayInfo(railwayCode);
  const info = railway.data;

  const stationsQuery = useStationsInfoByRailwayCode(railwayCode);
  const stationList = stationsQuery.data;

  const railwayProgressQuery = useRailwayProgress(isAuthenticated ? railwayCode : undefined);
  const railwayProgress = railwayProgressQuery.data;

  const railwayPathQuery = useRailPath(railwayCode);
  const railwayPath = railwayPathQuery.data;

  if(railway.isError || stationsQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(!info || !stationList){
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
    stationList?.forEach(item => {
      codeMap[item.stationCode] = { lat: item.latitude, lng: item.longitude };
    });
    return codeMap;
  })();

  return (
    <Container>
      <Box>
        <Typography
          variant="h3"
          sx={{
            lineHeight: 1,
            textDecoration: "underline",
            textDecorationColor: "#" + info.railwayColor,
            textDecorationThickness: 3,
          }}
        >
          {info.railwayName}
        </Typography>
        <Typography variant="h6" sx={{ fontSize: 16 }}>{info.railwayKana}</Typography>

        <Button
          component={Link}
          to={"/company/" + info.companyCode}
          color="inherit"
          sx={{ padding: 0, mb: 0.5 }}
        >
          <Typography variant="h5">{info.companyName}</Typography>
        </Button>

        <CustomLink to="/railway">
          <Typography variant="h6" sx={{ fontSize: 14 }}>路線一覧</Typography>
        </CustomLink>
      </Box>

      {isAuthenticated && railwayProgress && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              fontSize: 14,
              textAlign: "right",
            }}
          >
            {`${railwayProgress.getOrPassStationNum}/${railwayProgress.stationNum}`}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={railwayProgress.getOrPassStationNum / railwayProgress.stationNum * 100}
          />
        </Box>
      )}

      <Box>
        {stationList.map(item => (
          <StationItem key={item.stationCode} info={item} isAuthenticated={isAuthenticated} />
        ))}
      </Box>


      <MapContainer center={centerPosition} zoom={10} style={{ height: "80vh" }} renderer={Leaflet.canvas()}>
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
  )
};

export default RailwayInfo;
