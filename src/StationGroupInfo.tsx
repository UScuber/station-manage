import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  RecordState,
  Station,
  StationGroupDate,
  StationHistoryData,
  useDeleteStationGroupHistoryMutation,
  useDeleteStationHistoryMutation,
  useLatestStationGroupHistory,
  useLatestStationHistory,
  useSearchKNearestStationGroups,
  useSendStationGroupStateMutation,
  useStationGroupAllHistory,
  useStationGroupInfo,
  useStationsInfoByGroupCode,
} from "./Api";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Leaflet, { LatLng } from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AccessButton, AroundTime, Collapser, ConfirmDialog, RespStationName } from "./components";
import getDateString from "./utils/getDateString";


const stateName = ["乗降", "通過", "立ち寄り"];


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

      <Typography variant="h6" sx={{ fontSize: 18 }}>乗降: <AroundTime date={latestDate?.getDate} invalidMsg="なし" /></Typography>
      <Typography variant="h6" sx={{ fontSize: 18 }}>通過: <AroundTime date={latestDate?.passDate} invalidMsg="なし" /></Typography>
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

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteHistoryItem, setDeleteHistoryItem] = useState<StationHistoryData>();
  const [disableTooltip, setDisableTooltip] = useState(false);

  const groupStations = useStationsInfoByGroupCode(stationGroupCode);
  const stationList = groupStations.data;

  const groupStationQuery = useStationGroupInfo(stationGroupCode);
  const groupStationData = groupStationQuery.data;
  const latestDateQuery = useLatestStationGroupHistory(stationGroupCode, (data: StationGroupDate) => {
    setLoading(false);
  });
  const latestDate = latestDateQuery.data;

  const stationGroupAllHistoryQuery = useStationGroupAllHistory(stationGroupCode, (data: StationHistoryData[]) => {
    setDeleteLoading(false);
  });
  const stationGroupAllHistory = stationGroupAllHistoryQuery.data;

  const nearStationsQuery = useSearchKNearestStationGroups(
    groupStationData ? { lat: groupStationData.latitude, lng: groupStationData.longitude } : undefined,
    5
  );
  const nearStations = nearStationsQuery.data;

  const sendMutation = useSendStationGroupStateMutation();
  const deleteStationHistoryMutation = useDeleteStationHistoryMutation();
  const deleteStationGroupHistoryMutation = useDeleteStationGroupHistoryMutation();

  const handleSubmit = () => {
    setLoading(true);

    sendMutation.mutate({
      stationGroupCode: stationGroupCode,
      date: new Date(),
    });
  };

  const handleDeleteHistory = (history: StationHistoryData) => {
    if(history.state === RecordState.Get || history.state === RecordState.Pass){
      deleteStationHistoryMutation.mutate({
        stationCode: history.stationCode!,
        stationGroupCode: history.stationGroupCode,
        date: history.date,
        state: history.state,
      });
    }else{
      deleteStationGroupHistoryMutation.mutate({
        stationGroupCode: history.stationGroupCode,
        date: history.date,
      });
    }
    setDeleteLoading(true);
  };

  const handleSubmitCustomDate = (date: Date) => {
    sendMutation.mutate({
      stationGroupCode: stationGroupCode,
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [stationGroupCode]);


  if(groupStations.isError || groupStationQuery.isError || stationGroupAllHistoryQuery.isError){
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

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6">路線一覧</Typography>
        <Divider sx={{ mb: 1 }} />

        {stationList?.map(item => (
          <StationItem key={item.stationCode} info={item} />
        ))}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5">詳細</Typography>
        <Divider sx={{ mb: 1 }} />

        {!stationGroupAllHistory && (<Typography variant="h6" sx={{ display: "inline" }}>履歴 <CircularProgress size={20} /></Typography>)}
        {stationGroupAllHistory && (
          <Collapser
            buttonText={<Typography variant="h6" sx={{ display: "inline" }}>履歴 ({stationGroupAllHistory.length}件)</Typography>}
          >
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" component="div">History</Typography>
              <Table size="small" aria-label="dates">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>State</TableCell>
                    <TableCell>Railway</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stationGroupAllHistory.map(history => (
                    <TableRow key={`${history.date}|${history.state}`}>
                      <TableCell>{getDateString(history.date)}</TableCell>
                      <TableCell>{stateName[history.state]}</TableCell>
                      <TableCell
                        sx={{
                          textDecoration: "underline",
                          textDecorationColor: "#" + history?.railwayColor,
                          textDecorationThickness: 2,
                        }}
                      >
                        {history.railwayName ?? ""}
                      </TableCell>
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
              descriptionFn={value => `${getDateString(value.date)}  ${value.railwayName ?? ""}  ${stateName[value.state]}`}
            />
          </Collapser>
        )}

        <CustomSubmitForm onSubmit={handleSubmitCustomDate} />
      </Box>

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
