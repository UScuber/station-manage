import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  useTheme,
  Checkbox,
} from "@mui/material";
import Map, { Layer, MapRef, Popup, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Railway,
  Station,
  StationProgress,
  useCompanyInfo,
  useCompanyProgress,
  useRailPathByCompanyCode,
  useRailwayProgressListByCompanyCode,
  useRailwaysInfoByCompanyCode,
  useStationsInfoByCompanyCode,
} from "../api";
import {
  CircleProgress,
  CustomLink,
  ProgressBar,
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

const CompanyStationMap = ({
  companyCode,
  stationList,
}: {
  companyCode: number;
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

  const railwayPathQuery = useRailPathByCompanyCode(companyCode);
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

  const lineFeatures = railwayPath || [];

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
              "line-color": ["concat", "#", ["get", "railwayColor"]],
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
              display: "inline-block",
              mr: 2,
              textDecoration: "underline",
              textDecorationColor: "#" + info.railwayColor,
              textDecorationThickness: 3,
            }}
          >
            {info.railwayName}
          </Typography>
          {progress && <CircleProgress size={25} progress={progress} />}
        </Box>
        <Typography variant="h6" sx={{ fontSize: 16 }}>
          {info.formalName}
        </Typography>
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

  const railwayProgressQuery = useRailwayProgressListByCompanyCode(companyCode);
  const railwayProgress = railwayProgressQuery.data;
  const companyProgressQuery = useCompanyProgress(companyCode);
  const companyProgress = companyProgressQuery.data;

  const stationsQuery = useStationsInfoByCompanyCode(companyCode);
  const stationList = stationsQuery.data;

  if (companyQuery.isError || railwaysQuery.isError || stationsQuery.isError) {
    return (
      <Container>
        <Typography variant="h5">
          Error:{" "}
          {companyQuery.error?.message ||
            railwaysQuery.error?.message ||
            stationsQuery.error?.message}
        </Typography>
      </Container>
    );
  }

  if (!info || !railwayList || !stationList) {
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
        <Typography variant="h3">{info.companyName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 16, mb: 0.5 }}>
          {info.formalName}
        </Typography>
        <CustomLink to="/company">
          <Typography variant="h6" sx={{ fontSize: 14 }}>
            会社一覧
          </Typography>
        </CustomLink>
      </Box>

      {companyProgress && (
        <ProgressBar progress={companyProgress} sx={{ mb: 2 }} />
      )}

      <Box sx={{ mb: 2 }} />

      <TabNavigation>
        <TabPanel label="路線一覧">
          {railwayList.map((item, idx) => (
            <RailwayItem
              info={item}
              progress={railwayProgress ? railwayProgress[idx] : undefined}
              key={item.railwayCode}
            />
          ))}
        </TabPanel>

        <TabPanel label="マップ">
          <CompanyStationMap
            companyCode={companyCode}
            stationList={stationList}
          />
        </TabPanel>
      </TabNavigation>
    </Container>
  );
};

export default CompanyInfo;
