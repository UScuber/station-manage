import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import Map, { Layer, Popup, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Station,
  StationGroup,
  StationGroupDate,
  useLatestStationGroupHistory,
  useLatestStationHistory,
  useSearchKNearestStationGroups,
  useSendStationGroupStateMutation,
  useStationGroupInfo,
  useStationsInfoByGroupCode,
} from "../api";
import { useAuth } from "../auth";
import {
  AccessButton,
  AroundTime,
  CustomSubmitFormGroup,
  GroupHistoryTable,
  RespStationName,
  TabNavigation,
  TabPanel,
} from "../components";


const StationMap = ({
  groupStationData,
}: {
  groupStationData: StationGroup;
}) => {
  const [hideStations, setHideStations] = useState(false);
  const [popupInfo, setPopupInfo] = useState<{
    lng: number;
    lat: number;
    stationGroupCode: number;
    stationName: string;
  } | null>(null);

  const nearStationsQuery = useSearchKNearestStationGroups(
    { lat: groupStationData.latitude, lng: groupStationData.longitude },
    5
  );
  const nearStations = nearStationsQuery.data;

  // Features for formatting
  const stationFeatures = nearStations
    ? nearStations.map((item) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [item.longitude, item.latitude],
        },
        properties: {
          stationGroupCode: item.stationGroupCode,
          stationName: item.stationName,
        },
      }))
    : [];
  // Add current station to features if not present (though usually nearest includes self, let's be safe or just rely on nearest)
  // Actually nearest 5 usually includes the station itself if distance is 0.
  // But let's make sure we display the main station prominently or just all as stations.
  // The original Leaflet implementation showed only the main station initially and then added neighbors?
  // No, `nearStations` was mapped. And main station was `Marker position={position}` separately.
  // So I should combine them.

  const allFeatures = [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [groupStationData.longitude, groupStationData.latitude],
      },
      properties: {
        stationGroupCode: groupStationData.stationGroupCode,
        stationName: groupStationData.stationName,
        isMain: true,
      },
    },
    ...(stationFeatures || []).filter(
      (f) =>
        f.properties.stationGroupCode !== groupStationData.stationGroupCode
    ),
  ];

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
          longitude: groupStationData.longitude,
          latitude: groupStationData.latitude,
          zoom: 15,
        }}
        style={{ height: "60vh" }}
        mapStyle={import.meta.env.VITE_MAPBOX_STYLE_URL}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
        interactiveLayerIds={!hideStations ? ["stations"] : []}
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
            stationGroupCode: props?.stationGroupCode,
            stationName: props?.stationName,
          });
        }}
      >
        {!hideStations && (
          <Source
            type="geojson"
            data={{
              type: "FeatureCollection",
              features: allFeatures as any,
            }}
          >
            <Layer
              id="stations"
              type="circle"
              paint={{
                "circle-radius": 6,
                "circle-color": [
                  "case",
                  ["boolean", ["get", "isMain"], false],
                  "#ff0000",
                  "#007aff",
                ],
                "circle-stroke-width": 1,
                "circle-stroke-color": "#fff",
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
              <Link to={`/stationGroup/${popupInfo.stationGroupCode}`}>
                {popupInfo.stationName}
              </Link>
            </Box>
          </Popup>
        )}
      </Map>
    </>
  );
};

const StationItem = ({ info }: { info: Station }): React.ReactElement => {
  const latestDateQuery = useLatestStationHistory(info.stationCode);
  const latestDate = latestDateQuery.data;

  return (
    <Button
      component={Link}
      to={"/station/" + info.stationCode}
      variant="outlined"
      color="inherit"
      sx={{ display: "block", mb: 0.5 }}
    >
      <Typography variant="h6" sx={{ fontSize: 15, display: "inline-block" }}>
        {info.railwayCompany}
      </Typography>
      <Typography
        variant="h6"
        sx={{
          mx: 1,
          display: "inline-block",
          textDecoration: "underline",
          textDecorationColor: "#" + info.railwayColor,
          textDecorationThickness: 3,
        }}
      >
        {info.railwayName}
      </Typography>

      {(latestDate || latestDateQuery.isLoading) && (
        <>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontSize: 18 }}>
              乗降:&nbsp;
            </Typography>
            <AroundTime
              date={latestDate?.getDate}
              invalidMsg="なし"
              isLoading={latestDateQuery.isLoading}
              fontSize={18}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontSize: 18 }}>
              通過:&nbsp;
            </Typography>
            <AroundTime
              date={latestDate?.passDate}
              invalidMsg="なし"
              isLoading={latestDateQuery.isLoading}
              fontSize={18}
            />
          </Box>
        </>
      )}
    </Button>
  );
};

const StationGroupInfo = () => {
  const stationGroupCode = Number(
    useParams<"stationGroupCode">().stationGroupCode
  );
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);

  const groupStations = useStationsInfoByGroupCode(stationGroupCode);
  const stationList = groupStations.data;

  const groupStationQuery = useStationGroupInfo(stationGroupCode);
  const groupStationData = groupStationQuery.data;
  const latestDateQuery = useLatestStationGroupHistory(
    stationGroupCode,
    (data: StationGroupDate) => {
      setLoading(false);
    }
  );
  const latestDate = latestDateQuery.data;

  const sendMutation = useSendStationGroupStateMutation();

  const handleSubmit = () => {
    setLoading(true);

    sendMutation.mutate({
      stationGroupCode: stationGroupCode,
      date: new Date(),
    });
  };

  const handleSubmitCustomDate = (date: Date) => {
    sendMutation.mutate({
      stationGroupCode: stationGroupCode,
      date: date,
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stationGroupCode]);

  if (groupStations.isError || groupStationQuery.isError) {
    return (
      <Container>
        <Typography variant="h5">
          Error:{" "}
          {groupStations.error?.message || groupStationQuery.error?.message}
        </Typography>
      </Container>
    );
  }

  if (!stationList || !groupStationData) {
    return (
      <Container>
        Loading...
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <RespStationName variant="h3" sx={{ lineHeight: 1 }}>
            {groupStationData.stationName}
          </RespStationName>
          <RespStationName variant="h6" sx={{ fontSize: 16 }}>
            {groupStationData.kana}
          </RespStationName>
        </Box>
        <Button
          component={Link}
          to={"/pref/" + groupStationData.prefCode}
          color="inherit"
          sx={{ padding: 0 }}
        >
          <Typography variant="h6">{groupStationData.prefName}</Typography>
        </Button>
      </Box>

      {isAuthenticated && (
        <>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6">立ち寄り:&nbsp;</Typography>
            <AroundTime
              date={latestDate?.date}
              invalidMsg="なし"
              isLoading={latestDateQuery.isLoading}
            />
          </Box>

          <AccessButton
            text="立ち寄り"
            loading={loading}
            timeLimit={60 * 3}
            accessedTime={latestDate?.date}
            onClick={handleSubmit}
            sx={{ display: "inline-block" }}
          />

          <Box sx={{ my: 1 }} />
        </>
      )}

      <TabNavigation>
        <TabPanel label="路線一覧">
          {stationList?.map((item) => (
            <StationItem info={item} key={item.stationCode} />
          ))}
        </TabPanel>

        <TabPanel label="履歴" disabled={!isAuthenticated}>
          <GroupHistoryTable stationGroupCode={stationGroupCode} />
        </TabPanel>

        <TabPanel label="カスタム" disabled={!isAuthenticated}>
          <CustomSubmitFormGroup onSubmit={handleSubmitCustomDate} />
        </TabPanel>

        <TabPanel label="マップ">
          <StationMap groupStationData={groupStationData} />
        </TabPanel>
      </TabNavigation>
    </Container>
  );
};

export default StationGroupInfo;
