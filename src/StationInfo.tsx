import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { RecordState, Station, StationHistoryData, useDeleteStationHistoryMutation, useSearchKNearestStationGroups, useSendStationStateMutation, useStationAllHistory, useStationInfo } from "./Api";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  ListItemText,
  Stack,
  Toolbar,
  Divider,
  IconButton,
  Collapse,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import {
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import AccessButton from "./components/AccessButton";
import AroundTime from "./components/AroundTime";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Leaflet, { LatLng } from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
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


const NextStation = (
  { code }
  :{
    code: number,
  }
): JSX.Element => {
  const station = useStationInfo(code);
  const info = station.data;

  if(station.isLoading){
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
        <Typography variant="h6">{info?.stationName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 12, lineHeight: 1 }}>{info?.kana}</Typography>
      </Button>
    </Stack>
  );
};


const StationInfo = () => {
  const stationCode = Number(useParams<"stationCode">().stationCode);

  const [getLoading, setGetLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  if(station.isLoading || stationHistoryQuery.isLoading){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  const position = new LatLng(info!.latitude, info!.longitude);

  return (
    <Container>
      <Box maxWidth="sm" sx={{ margin: "auto" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h3" sx={{ lineHeight: 1 }}>{info?.stationName}</Typography>
          <Typography variant="h6" sx={{ fontSize: 16 }}>{info?.kana}</Typography>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, height: "120px" }}>
          <Box sx={{ textAlign: "left" }}>
            {info?.left.map(code => (
              <NextStation key={code} code={code} />
            ))}
          </Box>
          <Box sx={{ textAlign: "right" }}>
            {info?.right.map(code => (
              <NextStation key={code} code={code} />
            ))}
          </Box>
        </Box>
      </Box>
      <Box>
        <Button
          component={Link}
          to={"/pref/" + info?.prefCode}
          color="inherit"
          sx={{ padding: 0 }}
        >
          <Typography variant="h6">{info?.prefName}</Typography>
        </Button>

        <Box>
          <Button
            component={Link}
            to={"/company/" + info?.companyCode}
            color="inherit"
            sx={{ padding: 0 }}
          >
            <Typography variant="h6" sx={{ fontSize: 15, display: "inline-block" }}>{info?.railwayCompany}</Typography>
          </Button>
          <Button
            component={Link}
            to={"/railway/" + info?.railwayCode}
            color="inherit"
            sx={{ padding: 0 }}
          >
            <Typography
              variant="h6"
              sx={{
                mx: 1,
                display: "inline-block",
                textDecoration: "underline",
                textDecorationColor: "#" + info?.railwayColor,
                textDecorationThickness: 3,
              }}
            >
              {info?.railwayName}
            </Typography>
          </Button>
        </Box>

        <Typography variant="h6" sx={{ color: "gray" }}>最終アクセス:</Typography>
        <Box sx={{ mx: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6">乗降:&nbsp;</Typography>
            <AroundTime date={info?.getDate} invalidMsg="なし" />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6">通過:&nbsp;</Typography>
            <AroundTime date={info?.passDate} invalidMsg="なし" />
          </Box>
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Stack spacing={2} direction="row" sx={{ mb: 2 }}>
          <AccessButton
            text="乗降"
            loading={getLoading}
            timeLimit={60*3}
            accessedTime={info?.getDate}
            onClick={() => handleSubmit(RecordState.Get)}
          />
          <AccessButton
            text="通過"
            loading={passLoading}
            timeLimit={60*3}
            accessedTime={info?.passDate}
            onClick={() => handleSubmit(RecordState.Pass)}
          />
        </Stack>
        <Button
          component={Link}
          to={"/stationGroup/" + info?.stationGroupCode}
          variant="outlined"
        >
          <ListItemText primary="駅グループ" />
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="h5">詳細</Typography>
        <Divider sx={{ mb: 1 }} light />

        <Typography variant="h6" sx={{ display: "inline" }}>履歴 ({stationHistory?.length}件)</Typography>
        <IconButton
          aria-label="expand row"
          onClick={() => setOpen(!open)}
        >
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>

        <Collapse in={open} timeout="auto" unmountOnExit>
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
                {stationHistory?.map(history => (
                  <TableRow key={`${history.date}|${history.state}`}>
                    <TableCell>{getDateString(history.date)}</TableCell>
                    <TableCell>{stateName[history.state]}</TableCell>
                    <TableCell>
                      <IconButton
                        aria-label="delete"
                        size="small"
                        onClick={() => handleDeleteHistory(history)}
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
        </Collapse>
      </Box>

      <MapContainer center={position} zoom={15} style={{ height: "60vh" }}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <Box sx={{ textAlign: "center" }}>{info?.stationName}</Box>
          </Popup>
          <Tooltip direction="bottom" opacity={1} permanent>{info?.stationName}</Tooltip>
        </Marker>
        {nearStations && nearStations.filter((v,i) => i).map(item => (
          <Marker position={[item.latitude, item.longitude]} key={item.stationGroupCode}>
            <Popup>
              <Box sx={{ textAlign: "center" }}>
                <Link to={"/stationGroup/" + item.stationGroupCode}>{item.stationName}</Link>
              </Box>
            </Popup>
          </Marker>
        ))}
        <ChangeMapCenter position={position} />
      </MapContainer>
      <Toolbar />
    </Container>
  );
};

export default StationInfo;
