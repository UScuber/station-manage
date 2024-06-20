import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Leaflet, { LatLng } from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import dayjs, { Dayjs } from "dayjs";
import {
  Station,
  StationGroupDate,
  useLatestStationGroupHistory,
  useLatestStationHistory,
  useSearchKNearestStationGroups,
  useSendStationGroupStateMutation,
  useStationGroupInfo,
  useStationsInfoByGroupCode,
} from "../api/Api";
import { useAuth } from "../auth/auth";
import {
  AccessButton,
  AroundTime,
  Collapser,
  GroupHistoryTable,
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
        <Typography variant="h6" sx={{ fontSize: 18 }}>乗降: <AroundTime date={latestDate?.getDate} invalidMsg="なし" /></Typography>
        <Typography variant="h6" sx={{ fontSize: 18 }}>通過: <AroundTime date={latestDate?.passDate} invalidMsg="なし" /></Typography>
      </>)}
    </Button>
  );
};


const CustomSubmitForm = (
  { onSubmit }
  :{
    onSubmit: (date: Date) => unknown,
  }
) => {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [time, setTime] = useState<Dayjs | null>(null);
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState("");

  const onSubmitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if(date === null || time === null || date > dayjs()){
      setError(true);
      setHelperText("日付を選択してください");
    }else{
      setError(false);
      setHelperText("追加されました");
      onSubmit(new Date(date.format("YYYY-MM-DD") + " " + time.format("hh:mm:ss")));
      // reset
      setDate(null);
      setTime(null);
    }
  };

  return (
    <Collapser
      buttonText={<Typography variant="h6" sx={{ display: "inline" }}>カスタム</Typography>}
      sx={{ mb: 2 }}
      collapseSx={{ mx: 2 }}
    >
      <form onSubmit={onSubmitForm}>
        <FormControl error={error} variant="standard" required>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="ja"
            dateFormats={{ year: "YYYY", month: "M月" }}
          >
            <DatePicker
              label="日付"
              value={date}
              onChange={(date) => setDate(date)}
              slotProps={{
                textField: { size: "small" },
                toolbar: { toolbarFormat: "YYYY年 M月" },
              }}
              format="YYYY-MM-DD"
              sx={{ display: "inline-block", mb: 1 }}
              disableFuture
            />
            <TimePicker
              label="時間"
              value={time}
              onChange={(time) => setTime(time)}
              slotProps={{ textField: { size: "small" } }}
              views={["hours", "minutes", "seconds"]}
              sx={{ mb: 1 }}
            />
          </LocalizationProvider>
          <FormHelperText>{helperText}</FormHelperText>
          <Button type="submit" variant="outlined" sx={{ mt: 1 }}>送信</Button>
        </FormControl>
      </form>
    </Collapser>
  );
};


const StationGroupInfo = () => {
  const stationGroupCode = Number(useParams<"stationGroupCode">().stationGroupCode);
  const { isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(false);
  const [disableTooltip, setDisableTooltip] = useState(false);

  const groupStations = useStationsInfoByGroupCode(stationGroupCode);
  const stationList = groupStations.data;

  const groupStationQuery = useStationGroupInfo(stationGroupCode);
  const groupStationData = groupStationQuery.data;
  const latestDateQuery = useLatestStationGroupHistory(stationGroupCode, (data: StationGroupDate) => {
    setLoading(false);
  });
  const latestDate = latestDateQuery.data;

  const nearStationsQuery = useSearchKNearestStationGroups(
    groupStationData ? { lat: groupStationData.latitude, lng: groupStationData.longitude } : undefined,
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
          立ち寄り: <AroundTime date={latestDate?.date} invalidMsg="なし" />
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

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">路線一覧</Typography>
        <Divider sx={{ mb: 1 }} />

        {stationList?.map(item => (
          <StationItem info={item} key={item.stationCode} />
        ))}
      </Box>

      <Typography variant="h5">詳細</Typography>
      <Divider sx={{ mb: 1 }} />

      {isAuthenticated && (
        <Box sx={{ mb: 2 }}>
          <GroupHistoryTable stationGroupCode={stationGroupCode} />

          <CustomSubmitForm onSubmit={handleSubmitCustomDate} />
        </Box>
      )}

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

      <MapContainer center={position} zoom={15} style={{ height: "60vh" }}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <Box sx={{ textAlign: "center" }}>{groupStationData?.stationName}</Box>
          </Popup>
          <Tooltip direction="bottom" opacity={1} permanent>{groupStationData?.stationName}</Tooltip>
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
      </MapContainer>
    </Container>
  );
};

export default StationGroupInfo;
