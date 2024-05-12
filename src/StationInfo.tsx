import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  RecordState,
  Station,
  StationHistoryData,
  useDeleteStationHistoryMutation,
  useRailPath,
  useSearchKNearestStationGroups,
  useSendStationStateMutation,
  useStationAllHistory,
  useStationInfo,
  useStationsInfoByRailwayCode,
} from "./Api";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  ListItemText,
  Stack,
  Divider,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  styled,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  FormHelperText,
  Checkbox,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { GeoJSON, MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Leaflet, { LatLng } from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { GeoJsonObject } from "geojson";
import ReactDomServer from "react-dom/server";
import { DatePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/ja";
import { AccessButton, AroundTime, Collapser, ConfirmDialog, RespStationName } from "./components";
import getDateString from "./utils/getDateString";


const DefaultIcon = Leaflet.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [13, 40],
  popupAnchor: [0, -35],
});
Leaflet.Marker.prototype.options.icon = DefaultIcon;

const stateName = ["乗降", "通過"];

const ChangeMapCenter = ({ position }: { position: LatLng }) => {
  const map = useMap();
  map.panTo(position);
  return null;
};


const NextStationName = styled(Typography)(({ theme }) => ({
  fontSize: 20,
  [theme.breakpoints.down("md")]: {
    fontSize: 18,
  },
}));
const NextStationKana = styled(Typography)(({ theme }) => ({
  fontSize: 11,
  lineHeight: 1,
  [theme.breakpoints.down("md")]: {
    fontSize: 10,
  },
}));

const NextStation = ({ code }: { code: number }): JSX.Element => {
  const station = useStationInfo(code);
  const info = station.data;

  if(!info){
    return (
      <Box>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Stack direction="row" sx={{ display: "inline" }}>
      <Button
        component={Link}
        to={"/station/" + code}
        color="inherit"
        sx={{ display: "block", padding: 0 }}
      >
        <NextStationName variant="h6">{info.stationName}</NextStationName>
        <NextStationKana variant="h6">{info.kana}</NextStationKana>
      </Button>
    </Stack>
  );
};


const CustomSubmitForm = (
  { onSubmit }
  :{
    onSubmit: (date: Date, state: RecordState) => unknown,
  }
) => {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [time, setTime] = useState<Dayjs | null>(null);
  const [radioState, setRadioState] = useState<RecordState | null>(null);
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState("");

  const onSubmitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if(date === null || time === null || date > dayjs()){
      setError(true);
      setHelperText("日付を選択してください");
    }else if(radioState === null){
      setError(true);
      setHelperText("選択してください");
      return;
    }else{
      setError(false);
      setHelperText("追加されました");
      onSubmit(new Date(date.format("YYYY-MM-DD") + " " + time.format("hh:mm:ss")), radioState);
      // reset
      setDate(null);
      setTime(null);
      setRadioState(null);
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
          <RadioGroup
            name="state"
            value={radioState}
            onChange={(e) => setRadioState(+e.target.value)}
            row
          >
            <FormControlLabel value={RecordState.Get} control={<Radio size="small" />} label="乗降" />
            <FormControlLabel value={RecordState.Pass} control={<Radio size="small" />} label="通過" />
          </RadioGroup>
          <FormHelperText>{helperText}</FormHelperText>
          <Button type="submit" variant="outlined" sx={{ mt: 1 }}>送信</Button>
        </FormControl>
      </form>
    </Collapser>
  );
};

const StationInfo = () => {
  const stationCode = Number(useParams<"stationCode">().stationCode);

  const [getLoading, setGetLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteHistoryItem, setDeleteHistoryItem] = useState<StationHistoryData>();
  const [disableTooltip, setDisableTooltip] = useState(false);

  const station = useStationInfo(stationCode, (data: Station) => {
    if((data.getDate ?? new Date(0)) > (data.passDate ?? new Date(0))){
      setGetLoading(false);
    }else{
      setPassLoading(false);
    }
  });
  const info = station.data;

  const nearStationsQuery = useSearchKNearestStationGroups(
    info ? { lat: info.latitude, lng: info.longitude } : undefined,
    5
  );
  const nearStations = nearStationsQuery.data;

  const stationHistoryQuery = useStationAllHistory(stationCode, () => {
    setDeleteLoading(false);
  });
  const stationHistory = stationHistoryQuery.data;

  const stationsListQuery = useStationsInfoByRailwayCode(info?.railwayCode);
  const stationList = stationsListQuery.data;
  const railwayPathQuery = useRailPath(info?.railwayCode);
  const railwayPath = railwayPathQuery.data;

  const mutation = useSendStationStateMutation();
  const deleteStationHistoryMutation = useDeleteStationHistoryMutation();

  const navigation = useNavigate();
  const rightKeyRef = useRef(false);
  const leftKeyRef = useRef(false);

  const handleSubmit = (state: number) => {
    if(!info) return;

    if(state === RecordState.Get) setGetLoading(true);
    else setPassLoading(true);

    mutation.mutate({
      stationCode: stationCode,
      stationGroupCode: info.stationGroupCode,
      state: state,
      date: new Date(),
    });
  };

  const handleDeleteHistory = (history: StationHistoryData) => {
    deleteStationHistoryMutation.mutate({
      stationCode: history.stationCode!,
      stationGroupCode: history.stationGroupCode,
      date: history.date,
      state: history.state,
    });
    setDeleteLoading(true);
  };

  const handleSubmitCustomDate = (date: Date, state: RecordState) => {
    if(!info) return;

    mutation.mutate({
      stationCode: stationCode,
      stationGroupCode: info.stationGroupCode,
      state: Number(state),
      date: date,
    })
  };

  const handleDialogClose = (value: StationHistoryData | undefined) => {
    setDialogOpen(false);
    if(value) handleDeleteHistory(value);
  };

  const handleClickDeleteButton = (value: StationHistoryData) => {
    setDialogOpen(true);
    setDeleteHistoryItem(value);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if(!info) return;
    if(info.left.length >= 1 && !e.altKey && e.key === "ArrowLeft" && !leftKeyRef.current){
      navigation("/station/" + info.left[0]);
      leftKeyRef.current = true;
    }
    if(info.right.length >= 1 && !e.altKey && e.key === "ArrowRight" && !rightKeyRef.current){
      navigation("/station/" + info.right[0]);
      rightKeyRef.current = true;
    }
  }, [info, navigation]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if(e.key === "ArrowLeft") leftKeyRef.current = false;
    if(e.key === "ArrowRight") rightKeyRef.current = false;
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  if(station.isError || stationHistoryQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(!info){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  const lastAccessTime = ((info.getDate ?? 0) > (info.passDate ?? 0)) ? info.getDate : info.passDate;
  const position = new LatLng(info.latitude, info.longitude);

  return (
    <Container>
      <Box maxWidth="sm" sx={{ margin: "auto" }}>
        <Box sx={{ textAlign: "center" }}>
          <RespStationName variant="h3" sx={{ lineHeight: 1 }}>{info.stationName}</RespStationName>
          <RespStationName variant="h6">{info.kana}</RespStationName>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, height: "120px" }}>
          <Box sx={{ textAlign: "left" }}>
            {info.left.map(code => (
              <NextStation key={code} code={code} />
            ))}
          </Box>
          <Box sx={{ textAlign: "right" }}>
            {info.right.map(code => (
              <NextStation key={code} code={code} />
            ))}
          </Box>
        </Box>
      </Box>
      <Box>
        <Button
          component={Link}
          to={"/pref/" + info.prefCode}
          color="inherit"
          sx={{ padding: 0 }}
        >
          <Typography variant="h6">{info.prefName}</Typography>
        </Button>

        <Box>
          <Button
            component={Link}
            to={"/company/" + info.companyCode}
            color="inherit"
            sx={{ padding: 0 }}
          >
            <Typography variant="h6" sx={{ fontSize: 15, display: "inline-block" }}>{info.railwayCompany}</Typography>
          </Button>
          <Button
            component={Link}
            to={"/railway/" + info.railwayCode}
            color="inherit"
            sx={{ padding: 0 }}
          >
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
          </Button>
        </Box>

        <Typography variant="h6" sx={{ color: "gray" }}>最終アクセス:</Typography>
        <Box sx={{ mx: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6">乗降:&nbsp;</Typography>
            <AroundTime date={info.getDate} invalidMsg="なし" />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6">通過:&nbsp;</Typography>
            <AroundTime date={info.passDate} invalidMsg="なし" />
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Stack spacing={2} direction="row" sx={{ mb: 2 }}>
          <AccessButton
            text="乗降"
            loading={getLoading}
            timeLimit={60*3}
            accessedTime={lastAccessTime}
            onClick={() => handleSubmit(RecordState.Get)}
          />
          <AccessButton
            text="通過"
            loading={passLoading}
            timeLimit={60*3}
            accessedTime={lastAccessTime}
            onClick={() => handleSubmit(RecordState.Pass)}
          />
        </Stack>
        <Button
          component={Link}
          to={"/stationGroup/" + info.stationGroupCode}
          variant="outlined"
        >
          <ListItemText primary="駅グループ" />
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5">詳細</Typography>
        <Divider sx={{ mb: 1 }} />

        {!stationHistory && (<Typography variant="h6" sx={{ display: "inline" }}>履歴 <CircularProgress size={20} /></Typography>)}
        {stationHistory && (
          <Collapser
            buttonText={<Typography variant="h6" sx={{ display: "inline" }}>履歴 ({stationHistory.length}件)</Typography>}
          >
            <Box sx={{ margin: 1 }}>
              <Table size="small" aria-label="dates">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stationHistory.map(history => (
                    <TableRow key={`${history.date}|${history.state}`}>
                      <TableCell>{getDateString(history.date)}</TableCell>
                      <TableCell>{stateName[history.state]}</TableCell>
                      <TableCell>
                        <IconButton
                          aria-label="delete"
                          size="small"
                          onClick={() => handleClickDeleteButton(history)}
                          disabled={deleteLoading}
                        >
                          <DeleteIcon fontSize="inherit" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <ConfirmDialog
              open={dialogOpen}
              selectedValue={deleteHistoryItem}
              onClose={handleDialogClose}
              title="データを削除しますか"
              descriptionFn={value => `${getDateString(value.date)}  ${stateName[value.state]}`}
            />
          </Collapser>
        )}

        <CustomSubmitForm onSubmit={handleSubmitCustomDate} />
      </Box>

      <Box sx={{ textAlign: "right" }}>
        <Button
          color="inherit"
          onClick={() => setDisableTooltip(!disableTooltip)}
          sx={{ padding: 0, color: "gray", display: "inline-block" }}
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
        {stationList && railwayPath && (
          <>
            <GeoJSON
              data={railwayPath as unknown as GeoJsonObject}
              style={(feature) => ({
                color: "#" + feature?.properties.railwayColor,
                weight: 8,
              })}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(ReactDomServer.renderToString(
                  <div style={{ textAlign: "center" }}>
                    <span>{feature.properties.railwayName}</span>
                  </div>
                ));
              }}
            />

            <GeoJSON
              data={{
                type: "FeatureCollection",
                features: stationList.map(item => ({
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [item.longitude, item.latitude],
                  },
                  properties: {
                    stationCode: item.stationCode,
                    stationName: item.stationName,
                  },
                })),
              } as unknown as GeoJsonObject}
              onEachFeature={(feature, layer) => {
                layer.bindPopup(ReactDomServer.renderToString(
                  <div style={{ textAlign: "center" }}>
                    <a href={`/station/${feature.properties.stationCode}`}>{feature.properties.stationName}</a>
                  </div>
                ));
              }}
              pointToLayer={(feature, latlng) => {
                return Leaflet.circleMarker(latlng, {
                  radius: 6,
                  color: "black",
                  weight: 2,
                  fillColor: "white",
                  fillOpacity: 1,
                });
              }}
            />
          </>
        )}
        <Marker position={position}>
          <Popup>
            <Box sx={{ textAlign: "center" }}>{info.stationName}</Box>
          </Popup>
          <Tooltip direction="bottom" opacity={1} permanent>{info.stationName}</Tooltip>
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

export default StationInfo;
