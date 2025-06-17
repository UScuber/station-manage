import { Link, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  useTheme,
} from "@mui/material";
import { CircleMarker, FeatureGroup, Polyline, Popup } from "react-leaflet";
import {
  Railway,
  StationProgress,
  usePrefName,
  usePrefProgress,
  useRailwayProgressListByPrefCode,
  useRailwaysInfoByPrefCode,
  useStationsInfoByPrefCode,
} from "../api";
import { CustomLink, FitMapZoom, MapCustom, ProgressBar } from "../components";

const RailwayItem = ({
  info,
  progress,
}: {
  info: Railway;
  progress: StationProgress | undefined;
}): JSX.Element => {
  const theme = useTheme();
  const achieve_rate = progress
    ? (progress.getOrPassStationNum / progress.stationNum) * 100
    : undefined;

  return (
    <Button
      component={Link}
      to={"/railway/" + info.railwayCode}
      variant="outlined"
      color="inherit"
      sx={{
        display: "block",
        mb: 0.5,
        background: achieve_rate
          ? `linear-gradient(to right, ${theme.palette.access.main} ${achieve_rate}%, transparent ${achieve_rate}%)`
          : "none",
      }}
    >
      <Box sx={{ mb: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textDecoration: "underline",
              textDecorationColor: "#" + info.railwayColor,
              textDecorationThickness: 3,
            }}
          >
            {info.railwayName}
          </Typography>
          {progress && (
            <Box
              sx={{
                position: "relative",
                display: "flex",
                height: 25,
                alignItems: "center",
              }}
            >
              <CircularProgress
                variant="determinate"
                sx={{
                  color: (theme) =>
                    theme.palette.grey[
                      theme.palette.mode === "light" ? 200 : 800
                    ],
                }}
                size={25}
                thickness={6}
                value={100}
              />
              <CircularProgress
                variant="determinate"
                size={25}
                thickness={6}
                value={
                  (progress.getOrPassStationNum / progress.stationNum) * 100
                }
                sx={{ position: "absolute", left: 0 }}
              />
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  fontSize: 12,
                  ml: 1,
                  width: 48,
                  height: 20,
                  display: "inline-block",
                }}
              >
                {`${progress.getOrPassStationNum}/${progress.stationNum}`}
              </Typography>
            </Box>
          )}
        </Box>
        <Typography variant="h6" sx={{ fontSize: 16 }}>
          {info.formalName}
        </Typography>
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

  const prefProgressQuery = usePrefProgress(prefCode);
  const prefProgress = prefProgressQuery.data;

  const prefQuery = usePrefName(prefCode);
  const pref = prefQuery.data;

  const progressListQuery = useRailwayProgressListByPrefCode(prefCode);
  const progressList = progressListQuery.data;

  if (railwaysQuery.isError || stationsQuery.isError || prefQuery.isError) {
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if (!railwayList || !stationList || !pref) {
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  const centerPosition = stationList.reduce(
    (totPos, item) => ({
      lat: totPos.lat + item.latitude / stationList.length,
      lng: totPos.lng + item.longitude / stationList.length,
    }),
    { lat: 0, lng: 0 }
  );

  const stationsPositionMap = (() => {
    let codeMap: { [key: number]: { lat: number; lng: number } } = {};
    stationList.forEach((item) => {
      codeMap[item.stationCode] = { lat: item.latitude, lng: item.longitude };
    });
    return codeMap;
  })();

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3">{pref?.prefName}</Typography>
        <CustomLink to={"/pref"}>
          <Typography variant="h6" sx={{ fontSize: 14 }}>
            都道府県一覧
          </Typography>
        </CustomLink>
      </Box>

      {prefProgress && <ProgressBar progress={prefProgress} sx={{ mb: 2 }} />}

      {/* 路線のリスト */}
      <Box>
        {railwayList.map((item, idx) => (
          <RailwayItem
            info={item}
            progress={progressList ? progressList[idx] : undefined}
            key={item.railwayCode}
          />
        ))}
      </Box>

      <MapCustom center={centerPosition} zoom={10} style={{ height: "80vh" }}>
        {stationList.map((item) => (
          <FeatureGroup
            pathOptions={{ color: "#" + (item.railwayColor ?? "808080") }}
            key={item.stationCode}
          >
            <Popup>
              <Box sx={{ textAlign: "center" }}>
                <Link to={"/railway/" + item.railwayCode}>
                  {item.railwayName}
                </Link>
              </Box>
            </Popup>
            {item.left.map((code) => (
              <Polyline
                key={code}
                weight={8}
                positions={[
                  stationsPositionMap[item.stationCode],
                  stationsPositionMap[code],
                ]}
              />
            ))}
          </FeatureGroup>
        ))}
        {stationList.map((item) => (
          <CircleMarker
            center={[item.latitude, item.longitude]}
            pathOptions={{
              color: "black",
              weight: 2,
              fillColor: "white",
              fillOpacity: 1,
            }}
            radius={6}
            key={item.stationCode}
          >
            <Popup>
              <Box sx={{ textAlign: "center" }}>
                <Link to={"/station/" + item.stationCode}>
                  {item.stationName}
                </Link>
              </Box>
            </Popup>
          </CircleMarker>
        ))}
        <FitMapZoom
          positions={Object.keys(stationsPositionMap).map(
            (key) => stationsPositionMap[Number(key)]
          )}
        />
      </MapCustom>
    </Container>
  );
};

export default PrefectureInfo;
