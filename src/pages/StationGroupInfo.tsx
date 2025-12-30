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
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import Leaflet, { LatLng } from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
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
  MapCustom,
  RespStationName,
  TabNavigation,
  TabPanel,
} from "../components";

const DefaultIcon = Leaflet.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [13, 40],
  popupAnchor: [0, -35],
});
Leaflet.Marker.prototype.options.icon = DefaultIcon;

const ChangeMapCenter = ({ position }: { position: LatLng }) => {
  const map = useMap();
  map.panTo(position);
  return null;
};

const StationMap = ({
  groupStationData,
}: {
  groupStationData: StationGroup;
}) => {
  const [disableTooltip, setDisableTooltip] = useState(false);

  const nearStationsQuery = useSearchKNearestStationGroups(
    { lat: groupStationData.latitude, lng: groupStationData.longitude },
    5
  );
  const nearStations = nearStationsQuery.data;

  const position = new LatLng(
    groupStationData.latitude,
    groupStationData.longitude
  );

  return (
    <>
      <Box sx={{ textAlign: "right" }}>
        <Button
          color="inherit"
          onClick={() => setDisableTooltip(!disableTooltip)}
          sx={{ padding: 0, display: "inline-block" }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: 12, display: "inline-block" }}
          >
            駅名を非表示
          </Typography>
          <Checkbox size="small" checked={disableTooltip} sx={{ padding: 0 }} />
        </Button>
      </Box>

      <MapCustom center={position} zoom={15} style={{ height: "60vh" }}>
        <Marker position={position}>
          <Popup>
            <Box sx={{ textAlign: "center" }}>
              {groupStationData.stationName}
            </Box>
          </Popup>
          <Tooltip direction="bottom" opacity={1} permanent>
            {groupStationData.stationName}
          </Tooltip>
        </Marker>
        {nearStations &&
          nearStations
            .filter((_, i) => i)
            .map((item) => (
              <Marker
                position={[item.latitude, item.longitude]}
                key={item.stationGroupCode}
              >
                <Popup>
                  <Box sx={{ textAlign: "center" }}>
                    <Link to={"/stationGroup/" + item.stationGroupCode}>
                      {item.stationName}
                    </Link>
                  </Box>
                </Popup>
                {!disableTooltip && (
                  <Tooltip direction="bottom" opacity={1} permanent>
                    {item.stationName}
                  </Tooltip>
                )}
              </Marker>
            ))}
        <ChangeMapCenter position={position} />
      </MapCustom>
    </>
  );
};

const StationItem = ({ info }: { info: Station }): JSX.Element => {
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
