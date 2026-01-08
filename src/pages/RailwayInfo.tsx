import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
  Checkbox,
} from "@mui/material";
import Map, { Layer, MapRef, Popup, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
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
  ProgressBar,
  RespStationName,
  TabNavigation,
  TabPanel,
} from "../components";

const calcBounds = (
  points: { lat: number; lng: number }[]
): [[number, number], [number, number]] => {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const p of points) {
    minLng = Math.min(minLng, p.lng);
    minLat = Math.min(minLat, p.lat);
    maxLng = Math.max(maxLng, p.lng);
    maxLat = Math.max(maxLat, p.lat);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
};

const StationItem = ({
  info,
  latestDate,
}: {
  info: Station;
  latestDate: StationDate | undefined;
}): React.ReactElement => {
  const { isAuthenticated } = useAuth();

  return (
    <Button
      component={Link}
      to={"/station/" + info.stationCode}
      variant="outlined"
      color="inherit"
      sx={{
        display: "flex",
        justifyContent: "space-between",
        mb: 0.5,
        bgcolor:
          latestDate?.getDate || latestDate?.passDate ? "access.main" : "none",
      }}
    >
      <Box sx={{ mb: 1 }}>
        <RespStationName variant="h5">{info.stationName}</RespStationName>
        <RespStationName variant="h6" sx={{ lineHeight: 1 }}>
          {info.kana}
        </RespStationName>
      </Box>

      {isAuthenticated && (
        <Stack direction="column">
          <Typography variant="h6" color="text.secondary" sx={{ fontSize: 14 }}>
            乗降:
            <AroundTime
              date={latestDate?.getDate}
              invalidMsg="なし"
              fontSize={14}
              isLoading={!latestDate}
            />
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ fontSize: 14 }}>
            通過:
            <AroundTime
              date={latestDate?.passDate}
              invalidMsg="なし"
              fontSize={14}
              isLoading={!latestDate}
            />
          </Typography>
        </Stack>
      )}
    </Button>
  );
};

// stationListを始点があればそこから順に表示する(環状の場合、stationCodeの最小値)
const StationList = ({
  stationList,
  latestHistoryList,
}: {
  stationList: Station[];
  latestHistoryList: StationDate[] | undefined;
}) => {
  const indices = Object.fromEntries(
    stationList.map((station, idx) => [station.stationCode, idx])
  );

  const startIndex =
    indices[
      stationList.reduce((minSta, station) => {
        if (
          station.left.length + station.right.length !=
          minSta.left.length + minSta.right.length
        ) {
          return station.left.length + station.right.length <
            minSta.left.length + minSta.right.length
            ? station
            : minSta;
        }
        return station.stationCode < minSta.stationCode ? station : minSta;
      }, stationList[0]).stationCode
    ];

  let sorted_indexList: number[] = [];
  let used_indices = new Set();
  const dfs = (index: number, prev: number) => {
    if (used_indices.has(index)) return;

    used_indices.add(index);
    sorted_indexList.push(index);

    let once_called = false;
    stationList[index].left
      .concat(stationList[index].right)
      .sort((a, b) => a - b)
      .forEach((stationCode) => {
        if (prev == indices[stationCode]) return;

        if (once_called) sorted_indexList.push(-1); // 分岐する際はスペースを空ける

        dfs(indices[stationCode], index);
        once_called = true;
      });
  };
  dfs(startIndex, -1);

  return (
    <>
      {sorted_indexList.map((index) =>
        index === -1 ? (
          <Box sx={{ mb: 2 }} />
        ) : (
          <StationItem
            info={stationList[index]}
            latestDate={
              latestHistoryList ? latestHistoryList[index] : undefined
            }
            key={stationList[index].stationCode}
          />
        )
      )}
    </>
  );
};

const RailwayMap = ({
  railwayCode,
  stationList,
}: {
  railwayCode: number;
  stationList: Station[];
}) => {
  const [hideStations, setHideStations] = useState(false);
  const [popupInfo, setPopupInfo] = useState<{
    lng: number;
    lat: number;
    stationCode: number;
    stationName: string;
  } | null>(null);
  const mapRef = useRef<MapRef | null>(null);

  const railwayPathQuery = useRailPath(railwayCode);
  const railwayPath = railwayPathQuery.data;

  const centerPosition = stationList.reduce(
    (totPos, item) => ({
      lat: totPos.lat + item.latitude / stationList.length,
      lng: totPos.lng + item.longitude / stationList.length,
    }),
    { lat: 0, lng: 0 }
  );

  const handleFitBounds = useCallback(() => {
    if (!mapRef.current || stationList.length === 0) return;
    const bounds = calcBounds(
      stationList.map((item) => ({
        lat: item.latitude,
        lng: item.longitude,
      }))
    );

    mapRef.current.fitBounds(bounds, {
      padding: 40,
      duration: 0,
    });
  }, [stationList]);

  useEffect(() => {
    handleFitBounds();
  }, [handleFitBounds]);

  const stationFeatures = stationList.map((item) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [item.longitude, item.latitude],
    },
    properties: {
      stationCode: item.stationCode,
      stationName: item.stationName,
    },
  }));

  const lineFeatures = railwayPath ? [railwayPath] : [];

  return (
    <>
      <Box sx={{ textAlign: "right" }}>
        <Button
          color="inherit"
          onClick={() => setHideStations(!hideStations)}
          sx={{ padding: 0, display: "inline-block" }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: 12, display: "inline-block" }}
          >
            駅を非表示
          </Typography>
          <Checkbox size="small" checked={hideStations} sx={{ padding: 0 }} />
        </Button>
      </Box>

      <Map
        initialViewState={{
          longitude: centerPosition.lng,
          latitude: centerPosition.lat,
          zoom: 10,
        }}
        style={{ height: "80vh" }}
        mapStyle={import.meta.env.VITE_MAPBOX_STYLE_URL}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
        interactiveLayerIds={!hideStations ? ["stations"] : []}
        ref={mapRef}
        onLoad={handleFitBounds}
        onClick={(e) => {
          const feature = e.features?.[0];
          if (!feature) {
            setPopupInfo(null);
            return;
          }
          const { lat, lng } = e.lngLat;
          const props = feature.properties;
          setPopupInfo({
            lng,
            lat,
            stationCode: props?.stationCode,
            stationName: props?.stationName,
          });
        }}
      >
        <Source
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: lineFeatures as any,
          }}
        >
          <Layer
            id="lines"
            type="line"
            layout={{
              "line-join": "round",
              "line-cap": "round",
            }}
            paint={{
              "line-color": "#007aff",
              "line-width": 4,
            }}
          />
        </Source>

        {!hideStations && (
          <Source
            type="geojson"
            data={{
              type: "FeatureCollection",
              features: stationFeatures as any,
            }}
          >
            <Layer
              id="stations"
              type="circle"
              paint={{
                "circle-radius": 4,
                "circle-color": "#ffffff",
                "circle-stroke-width": 2,
                "circle-stroke-color": "#000000",
              }}
            />
          </Source>
        )}

        {popupInfo && (
          <Popup
            longitude={popupInfo.lng}
            latitude={popupInfo.lat}
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
          >
            <Box sx={{ textAlign: "center" }}>
              <Link to={`/station/${popupInfo.stationCode}`}>
                {popupInfo.stationName}
              </Link>
            </Box>
          </Popup>
        )}
      </Map>
    </>
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

  if (railway.isError || stationsQuery.isError) {
    return (
      <Container>
        <Typography variant="h5">
          Error: {railway.error?.message || stationsQuery.error?.message}
        </Typography>
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

      <Box sx={{ mb: 2 }} />

      <TabNavigation>
        <TabPanel label="駅一覧">
          <StationList
            stationList={stationList}
            latestHistoryList={latestHistoryList}
          />
        </TabPanel>

        <TabPanel label="マップ">
          <RailwayMap railwayCode={railwayCode} stationList={stationList} />
        </TabPanel>
      </TabNavigation>
    </Container>
  );
};

export default RailwayInfo;
