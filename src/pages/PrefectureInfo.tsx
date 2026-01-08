import { Link, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  useTheme,
} from "@mui/material";
import { Popup } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMemo, useState } from "react";
import {
  Railway,
  Station,
  StationProgress,
  usePrefName,
  usePrefProgress,
  useRailwayProgressListByPrefCode,
  useRailwaysInfoByPrefCode,
  useStationsInfoByPrefCode,
} from "../api";
import {
  CustomLink,
  MapCustom,
  StationMapGeojson,
  ProgressBar,
  TabNavigation,
  TabPanel,
} from "../components";

const PrefStationMap = ({ stationList }: { stationList: Station[] }) => {
  const centerPosition = useMemo(
    () =>
      stationList.reduce(
        (totPos, item) => ({
          lat: totPos.lat + item.latitude / stationList.length,
          lng: totPos.lng + item.longitude / stationList.length,
        }),
        { lat: 0, lng: 0 }
      ),
    [stationList]
  );

  const stationPosList = useMemo(
    () =>
      stationList.map((item) => ({
        lat: item.latitude,
        lng: item.longitude,
      })),
    [stationList]
  );

  const stationsPositionMap = useMemo(() => {
    let codeMap: { [key: number]: { lat: number; lng: number } } = {};
    stationList.forEach((item) => {
      codeMap[item.stationCode] = { lat: item.latitude, lng: item.longitude };
    });
    return codeMap;
  }, [stationList]);

  const [popupInfo, setPopupInfo] = useState<{
    lng: number;
    lat: number;
    stationCode: number;
    stationName: string;
    railwayCode: number;
    railwayName: string;
    isStation: boolean;
  } | null>(null);

  const lineFeatures = useMemo(
    () =>
      stationList.flatMap((item) =>
        item.left.map((code) => ({
          type: "Feature" as const,
          geometry: {
            type: "MultiLineString" as const,
            coordinates: [
              [
                [item.longitude, item.latitude] as [number, number],
                [
                  stationsPositionMap[code].lng,
                  stationsPositionMap[code].lat,
                ] as [number, number],
              ],
            ],
          },
          properties: {
            railwayCode: item.railwayCode,
            railwayName: item.railwayName,
            railwayColor: item.railwayColor,
            companyCode: item.companyCode,
            companyName: "",
            railwayKana: "",
            formalName: "",
          },
        }))
      ),
    [stationList, stationsPositionMap]
  );

  return (
    <MapCustom
      center={centerPosition}
      zoom={10}
      style={{ height: "80vh" }}
      stationList={stationPosList}
      interactiveLayerIds={["stations", "lines"]}
      onClick={(e) => {
        const feature = e.features?.[0];
        if (!feature) {
          setPopupInfo(null);
          return;
        }
        const { lat, lng } = e.lngLat;
        const props = feature.properties;
        const layerId = feature.layer.id;

        if (layerId === "stations") {
          setPopupInfo({
            lng,
            lat,
            stationCode: props?.stationCode,
            stationName: props?.stationName,
            railwayCode: props?.railwayCode,
            railwayName: props?.railwayName,
            isStation: true,
          });
        } else if (layerId === "lines") {
          setPopupInfo({
            lng,
            lat,
            stationCode: 0,
            stationName: "",
            railwayCode: props?.railwayCode,
            railwayName: props?.railwayName,
            isStation: false,
          });
        }
      }}
    >
      <StationMapGeojson railwayPath={lineFeatures} stationList={stationList} />
      {popupInfo && (
        <Popup
          longitude={popupInfo.lng}
          latitude={popupInfo.lat}
          onClose={() => setPopupInfo(null)}
          closeOnClick={false}
        >
          <Box sx={{ textAlign: "center" }}>
            {popupInfo.isStation ? (
              <Link to={"/station/" + popupInfo.stationCode}>
                {popupInfo.stationName}
              </Link>
            ) : (
              <Link to={"/railway/" + popupInfo.railwayCode}>
                {popupInfo.railwayName}
              </Link>
            )}
          </Box>
        </Popup>
      )}
    </MapCustom>
  );
};

const RailwayItem = ({
  info,
  progress,
}: {
  info: Railway;
  progress: StationProgress | undefined;
}): React.ReactElement => {
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
          ? `linear-gradient(to right, ${
              achieve_rate !== 100
                ? theme.palette.access.main
                : theme.palette.complete.main
            } ${achieve_rate}%, transparent ${achieve_rate}%)`
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
        <Typography variant="h5">
          Error:{" "}
          {railwaysQuery.error?.message ||
            stationsQuery.error?.message ||
            prefQuery.error?.message}
        </Typography>
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

      <Box sx={{ mb: 2 }} />

      <TabNavigation>
        <TabPanel label="路線一覧">
          {railwayList.map((item, idx) => (
            <RailwayItem
              info={item}
              progress={progressList ? progressList[idx] : undefined}
              key={item.railwayCode}
            />
          ))}
        </TabPanel>

        <TabPanel label="マップ">
          <PrefStationMap stationList={stationList} />
        </TabPanel>
      </TabNavigation>
    </Container>
  );
};

export default PrefectureInfo;
