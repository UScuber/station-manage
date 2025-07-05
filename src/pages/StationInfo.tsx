import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  Stack,
  styled,
  Checkbox,
  Tabs,
  Tab,
  FormHelperText,
} from "@mui/material";
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import Leaflet, { LatLng } from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import {
  RecordState,
  Station,
  StationDate,
  StationHistory,
  useLatestStationHistory,
  useRailPath,
  useSearchKNearestStationGroups,
  useSendStationStateMutation,
  useStationInfo,
  useStationsInfoByRailwayCode,
} from "../api";
import { useAuth } from "../auth";
import {
  AccessButton,
  AroundTime,
  CustomSubmitFormStation,
  HistoryListTable,
  MapCustom,
  StationMapGeojson,
  RespStationName,
  TimetableURL,
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

  if (!info) {
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

const CustomTabPanel = ({
  children,
  value,
  index,
  padding,
}: {
  children?: React.ReactNode;
  index: number;
  value: number;
  padding?: number;
}) => {
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

const StationMap = ({ info }: { info: Station | undefined }) => {
  const [disableTooltip, setDisableTooltip] = useState(false);

  const nearStationsQuery = useSearchKNearestStationGroups(
    info ? { lat: info.latitude, lng: info.longitude } : undefined,
    5
  );
  const nearStations = nearStationsQuery.data;

  const stationsListQuery = useStationsInfoByRailwayCode(info?.railwayCode);
  const stationList = stationsListQuery.data;
  const railwayPathQuery = useRailPath(info?.railwayCode);
  const railwayPath = railwayPathQuery.data;

  if (!info) {
    return (
      <Box>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Box>
    );
  }

  const position = new LatLng(info.latitude, info.longitude);

  return (
    <>
      <Box sx={{ textAlign: "right", mt: 1 }}>
        <Button
          color="inherit"
          onClick={() => setDisableTooltip(!disableTooltip)}
          sx={{ padding: 0, color: "gray", display: "inline-block" }}
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
        {stationList && railwayPath && (
          <StationMapGeojson
            railwayPath={railwayPath}
            stationList={stationList}
          />
        )}
        <Marker position={position}>
          <Popup>
            <Box sx={{ textAlign: "center" }}>{info.stationName}</Box>
          </Popup>
          <Tooltip direction="bottom" opacity={1} permanent>
            {info.stationName}
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

const StationInfo = () => {
  const stationCode = Number(useParams<"stationCode">().stationCode);
  const { isAuthenticated, isLoading } = useAuth();

  const [getLoading, setGetLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [buttonErrorMsg, setButtonErrorMsg] = useState("");
  const [tabValue, setTabValue] = useState(0);

  const station = useStationInfo(stationCode);
  const info = station.data;
  const latestDateQuery = useLatestStationHistory(
    stationCode,
    (data: StationDate) => {
      if ((data.getDate ?? new Date(0)) > (data.passDate ?? new Date(0))) {
        setGetLoading(false);
      } else {
        setPassLoading(false);
      }
    }
  );
  const latestDate = latestDateQuery.data;

  const handleSubmitError = (err: Error, variables: StationHistory) => {
    if (variables.state === RecordState.Get) {
      setGetLoading(false);
      setButtonErrorMsg(
        `${info?.stationName}駅 乗降記録の送信に失敗しました(Error: ${err.message})`
      );
    } else if (variables.state === RecordState.Pass) {
      setPassLoading(false);
      setButtonErrorMsg(
        `${info?.stationName}駅 通過記録の送信に失敗しました(Error: ${err.message})`
      );
    }
  };

  const mutation = useSendStationStateMutation(handleSubmitError);

  const navigation = useNavigate();
  const rightKeyRef = useRef(false);
  const leftKeyRef = useRef(false);

  const handleSubmit = (state: number) => {
    if (!info) return;

    if (state === RecordState.Get) setGetLoading(true);
    else setPassLoading(true);

    mutation.mutate({
      stationCode: stationCode,
      stationGroupCode: info.stationGroupCode,
      state: state,
      date: new Date(),
    });
  };

  const handleSubmitCustomDate = (date: Date, state: RecordState) => {
    if (!info) return;

    mutation.mutate({
      stationCode: stationCode,
      stationGroupCode: info.stationGroupCode,
      state: Number(state),
      date: date,
    });
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!info) return;
      if (
        info.left.length >= 1 &&
        !e.altKey &&
        e.key === "ArrowLeft" &&
        !leftKeyRef.current
      ) {
        navigation("/station/" + info.left[0]);
        leftKeyRef.current = true;
      }
      if (
        info.right.length >= 1 &&
        !e.altKey &&
        e.key === "ArrowRight" &&
        !rightKeyRef.current
      ) {
        navigation("/station/" + info.right[0]);
        rightKeyRef.current = true;
      }
    },
    [info, navigation]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") leftKeyRef.current = false;
    if (e.key === "ArrowRight") rightKeyRef.current = false;
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
    if (!isLoading && !isAuthenticated) setTabValue(3);
  }, [isLoading]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (station.isError) {
    return (
      <Container>
        <Typography variant="h5">Error: {station.error.message}</Typography>
      </Container>
    );
  }

  if (!info) {
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  const lastAccessTime =
    latestDate && (latestDate.getDate ?? 0) > (latestDate.passDate ?? 0)
      ? latestDate.getDate
      : latestDate?.passDate;

  return (
    <Container>
      <Box maxWidth="sm" sx={{ margin: "auto" }}>
        <Box sx={{ textAlign: "center" }}>
          <RespStationName variant="h3" sx={{ lineHeight: 1 }}>
            {info.stationName}
          </RespStationName>
          <RespStationName variant="h6">{info.kana}</RespStationName>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 2,
            height: "120px",
          }}
        >
          <Box sx={{ textAlign: "left" }}>
            {info.left.map((code) => (
              <NextStation key={code} code={code} />
            ))}
          </Box>
          <Box sx={{ textAlign: "right" }}>
            {info.right.map((code) => (
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
            <Typography
              variant="h6"
              sx={{ fontSize: 15, display: "inline-block" }}
            >
              {info.railwayCompany}
            </Typography>
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

        {isAuthenticated && (
          <>
            <Typography variant="h6" sx={{ color: "gray" }}>
              最終アクセス:
            </Typography>
            <Box sx={{ mx: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="h6">乗降:&nbsp;</Typography>
                <AroundTime
                  date={latestDate?.getDate}
                  invalidMsg="なし"
                  isLoading={latestDateQuery.isLoading}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="h6">通過:&nbsp;</Typography>
                <AroundTime
                  date={latestDate?.passDate}
                  invalidMsg="なし"
                  isLoading={latestDateQuery.isLoading}
                />
              </Box>
            </Box>
          </>
        )}
      </Box>

      <Box sx={{ mb: 2 }}>
        {/* 乗降/通過ボタン */}
        {isAuthenticated && (
          <>
            <Stack spacing={2} direction="row" sx={{ mb: 0 }}>
              <AccessButton
                text="乗降"
                loading={getLoading}
                timeLimit={60 * 3}
                accessedTime={lastAccessTime}
                onClick={() => handleSubmit(RecordState.Get)}
              />
              <AccessButton
                text="通過"
                loading={passLoading}
                timeLimit={60 * 3}
                accessedTime={lastAccessTime}
                onClick={() => handleSubmit(RecordState.Pass)}
              />
            </Stack>
            <FormHelperText error sx={{ m: 0 }}>
              {buttonErrorMsg || " "}
            </FormHelperText>
          </>
        )}

        <Button
          component={Link}
          to={"/stationGroup/" + info.stationGroupCode}
          variant="outlined"
        >
          駅グループ
        </Button>
      </Box>

      <Box sx={{ mb: 2 }} />

      <Box sx={{ minHeight: 600 }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
          >
            <Tab label="リンク" disabled={!isAuthenticated} />
            <Tab label="履歴" disabled={!isAuthenticated} />
            <Tab label="カスタム" disabled={!isAuthenticated} />
            <Tab label="マップ" />
          </Tabs>
        </Box>

        {/* リンク */}
        <CustomTabPanel value={tabValue} index={0}>
          {isAuthenticated && <TimetableURL info={info} />}
        </CustomTabPanel>

        {/* 履歴 */}
        <CustomTabPanel value={tabValue} index={1}>
          {isAuthenticated && <HistoryListTable stationCode={stationCode} />}
        </CustomTabPanel>

        {/* カスタム */}
        <CustomTabPanel value={tabValue} index={2}>
          {isAuthenticated && (
            <CustomSubmitFormStation onSubmit={handleSubmitCustomDate} />
          )}
        </CustomTabPanel>

        {/* マップ */}
        <CustomTabPanel value={tabValue} index={3} padding={0}>
          <StationMap info={info} />
        </CustomTabPanel>
      </Box>
    </Container>
  );
};

export default StationInfo;
