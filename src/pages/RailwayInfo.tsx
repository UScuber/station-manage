import { Link, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import {
  Station,
  StationDate,
  useLatestStationHistoryListByRailwayCode,
  useRailPath,
  useRailwayInfo,
  useRailwayProgress,
  useStationsInfoByRailwayCode,
} from "../api";
import { useAuth } from "../auth";
import {
  AroundTime,
  CustomLink,
  FitMapZoom,
  MapCustom,
  ProgressBar,
  StationMapGeojson,
} from "../components";

const StationItem = ({
  info,
  latestDate,
}: {
  info: Station;
  latestDate: StationDate | undefined;
}): JSX.Element => {
  const { isAuthenticated } = useAuth();

  return (
    <Button
      component={Link}
      to={"/station/" + info.stationCode}
      variant="outlined"
      color="inherit"
      sx={{
        display: "block",
        mb: 0.5,
        bgcolor:
          latestDate?.getDate || latestDate?.passDate ? "access.main" : "none",
      }}
    >
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6">{info.stationName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 10, lineHeight: 1 }}>
          {info.kana}
        </Typography>
      </Box>

      {isAuthenticated && (
        <>
          <Typography variant="h6" sx={{ fontSize: 14 }}>
            乗降:
            <AroundTime
              date={latestDate?.getDate}
              invalidMsg="なし"
              fontSize={14}
              isLoading={!latestDate}
            />
          </Typography>
          <Typography variant="h6" sx={{ fontSize: 14 }}>
            通過:
            <AroundTime
              date={latestDate?.passDate}
              invalidMsg="なし"
              fontSize={14}
              isLoading={!latestDate}
            />
          </Typography>
        </>
      )}
    </Button>
  );
};

const RailwayInfo = () => {
  const railwayCode = Number(useParams<"railwayCode">().railwayCode);

  const railway = useRailwayInfo(railwayCode);
  const info = railway.data;

  const stationsQuery = useStationsInfoByRailwayCode(railwayCode);
  const stationList = stationsQuery.data;
  const latestHistoryListQuery =
    useLatestStationHistoryListByRailwayCode(railwayCode);
  const latestHistoryList = latestHistoryListQuery.data;

  const railwayProgressQuery = useRailwayProgress(railwayCode);
  const railwayProgress = railwayProgressQuery.data;

  const railwayPathQuery = useRailPath(railwayCode);
  const railwayPath = railwayPathQuery.data;

  if (railway.isError || stationsQuery.isError) {
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if (!info || !stationList) {
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
    stationList?.forEach((item) => {
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
        <Typography variant="h6" sx={{ fontSize: 16 }}>
          {info.railwayKana}
        </Typography>

        <Button
          component={Link}
          to={"/company/" + info.companyCode}
          color="inherit"
          sx={{ padding: 0, mb: 0.5 }}
        >
          <Typography variant="h5">{info.companyName}</Typography>
        </Button>

        <CustomLink to="/railway">
          <Typography variant="h6" sx={{ fontSize: 14 }}>
            路線一覧
          </Typography>
        </CustomLink>
      </Box>

      {railwayProgress && (
        <ProgressBar progress={railwayProgress} sx={{ mb: 2 }} />
      )}

      <Box>
        {stationList.map((item, idx) => (
          <StationItem
            info={item}
            latestDate={latestHistoryList ? latestHistoryList[idx] : undefined}
            key={item.stationCode}
          />
        ))}
      </Box>

      <MapCustom center={centerPosition} zoom={10} style={{ height: "80vh" }}>
        {railwayPath && (
          <StationMapGeojson
            railwayPath={railwayPath}
            stationList={stationList}
          />
        )}
        <FitMapZoom
          positions={Object.keys(stationsPositionMap).map(
            (key) => stationsPositionMap[Number(key)]
          )}
        />
      </MapCustom>
    </Container>
  );
};

export default RailwayInfo;
