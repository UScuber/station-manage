import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import Leaflet, { LatLng } from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import {
  Station,
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


const CustomTabPanel = (
  { children, value, index, padding }
  :{
    children?: React.ReactNode,
    index: number,
    value: number,
    padding?: number,
  }
) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && <Box sx={{ p: padding ?? 2 }}>{children}</Box>}
    </div>
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
      <Typography variant="h6" sx={{ fontSize: 15, display: "inline-block" }}>{info.railwayCompany}</Typography>
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

      {(latestDate || latestDateQuery.isLoading) && (<>
        <Typography variant="h6" sx={{ fontSize: 18 }}>
          乗降: <AroundTime date={latestDate?.getDate} invalidMsg="なし" isLoading={latestDateQuery.isLoading} />
        </Typography>
        <Typography variant="h6" sx={{ fontSize: 18 }}>
          通過: <AroundTime date={latestDate?.passDate} invalidMsg="なし" isLoading={latestDateQuery.isLoading} />
        </Typography>
      </>)}
    </Button>
  );
};



const StationGroupInfo = () => {
  const stationGroupCode = Number(useParams<"stationGroupCode">().stationGroupCode);
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [disableTooltip, setDisableTooltip] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const groupStations = useStationsInfoByGroupCode(stationGroupCode);
  const stationList = groupStations.data;

  const groupStationQuery = useStationGroupInfo(stationGroupCode);
  const groupStationData = groupStationQuery.data;
  const latestDateQuery = useLatestStationGroupHistory(stationGroupCode, (data: StationGroupDate) => {
    setLoading(false);
  });
  const latestDate = latestDateQuery.data;

  const nearStationsQuery = useSearchKNearestStationGroups(
    (groupStationData && tabValue === 3) ? { lat: groupStationData.latitude, lng: groupStationData.longitude } : undefined,
    5
  );
  const nearStations = nearStationsQuery.data;

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
    })
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stationGroupCode]);


  if(groupStations.isError || groupStationQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(!stationList || !groupStationData){
    return (
      <Container>
        Loading...
        <CircularProgress />
      </Container>
    );
  }

  const position = new LatLng(groupStationData.latitude, groupStationData.longitude);

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <RespStationName variant="h3" sx={{ lineHeight: 1 }}>{groupStationData.stationName}</RespStationName>
          <RespStationName variant="h6" sx={{ fontSize: 16 }}>{groupStationData.kana}</RespStationName>
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

      {isAuthenticated && (<>
        <Typography variant="h6" sx={{ display: "inline-block" }}>
          立ち寄り: <AroundTime date={latestDate?.date} invalidMsg="なし" isLoading={latestDateQuery.isLoading} />
        </Typography>

        <AccessButton
          text="立ち寄り"
          loading={loading}
          timeLimit={60*3}
          accessedTime={latestDate?.date}
          onClick={handleSubmit}
          sx={{ mb: 2, display: "block" }}
        />
      </>)}

      <Box sx={{ minHeight: 600 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} >
            <Tab label="路線一覧" />
            <Tab label="履歴" disabled={!isAuthenticated} />
            <Tab label="カスタム" disabled={!isAuthenticated} />
            <Tab label="マップ" />
          </Tabs>
        </Box>

        {/* 路線一覧 */}
        <CustomTabPanel value={tabValue} index={0}>
          {stationList?.map(item => (
            <StationItem info={item} key={item.stationCode} />
          ))}
        </CustomTabPanel>

        {/* 履歴 */}
        <CustomTabPanel value={tabValue} index={1}>
          <GroupHistoryTable stationGroupCode={stationGroupCode} visible={tabValue === 1} />
        </CustomTabPanel>

        {/* カスタム */}
        <CustomTabPanel value={tabValue} index={2}>
          <CustomSubmitFormGroup onSubmit={handleSubmitCustomDate} />
        </CustomTabPanel>

        {/* マップ */}
        <CustomTabPanel value={tabValue} index={3}>
          <Box sx={{ textAlign: "right" }}>
            <Button
              color="inherit"
              onClick={() => setDisableTooltip(!disableTooltip)}
              sx={{ padding: 0, display: "inline-block" }}
            >
              <Typography variant="h6" sx={{ fontSize: 12, display: "inline-block" }}>駅名を非表示</Typography>
              <Checkbox
              size="small"
              checked={disableTooltip}
              sx={{ padding: 0 }}
            />
            </Button>
          </Box>

          <MapCustom center={position} zoom={15} style={{ height: "60vh" }}>
            <Marker position={position}>
              <Popup>
                <Box sx={{ textAlign: "center" }}>{groupStationData.stationName}</Box>
              </Popup>
              <Tooltip direction="bottom" opacity={1} permanent>{groupStationData.stationName}</Tooltip>
            </Marker>
            {nearStations && nearStations.filter((_,i) => i).map(item => (
              <Marker position={[item.latitude, item.longitude]} key={item.stationGroupCode}>
                <Popup>
                  <Box sx={{ textAlign: "center" }}>
                    <Link to={"/stationGroup/" + item.stationGroupCode}>{item.stationName}</Link>
                  </Box>
                </Popup>
                {!disableTooltip && <Tooltip direction="bottom" opacity={1} permanent>{item.stationName}</Tooltip>}
              </Marker>
            ))}
            <ChangeMapCenter position={position} />
          </MapCustom>
        </CustomTabPanel>
      </Box>
    </Container>
  );
};

export default StationGroupInfo;
