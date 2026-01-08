import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import Map, { Layer, Popup, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import {
  StationHistoryDetail,
  useCompanyList,
  useStationHistoryListAndInfo,
} from "../api";
import { useAuth } from "../auth";
import { CustomLink } from "../components";
import NotFound from "./NotFound";
import getDateString from "../utils/getDateString";
import getURLSearchParams from "../utils/getURLSearchParams";

type PathData = {
  railwayCode: number;
  railwayName: string;
  railwayColor: string;
  companyName: string;
  path: [number, number][];
  key: string;
};

// 同じ路線の移動ごとに分割
const splitHistoryList = (historyList: StationHistoryDetail[]): PathData[] => {
  if (!historyList.length) return [];
  let result: PathData[] = [
    {
      railwayCode: historyList[0].railwayCode,
      railwayName: historyList[0].railwayName,
      railwayColor: historyList[0].railwayColor,
      companyName: historyList[0].railwayCompany,
      path: [[historyList[0].latitude, historyList[0].longitude]],
      key: `${historyList[0].date.toString()}|${historyList[0].stationCode}`,
    },
  ];
  for (let i = 1; i < historyList.length; i++) {
    const cur = historyList[i];
    const prev = historyList[i - 1];
    if (
      cur.railwayCode === prev.railwayCode &&
      cur.date.getTime() - prev.date.getTime() < 1000 * 60 * 60 * 24 &&
      cur.left.concat(cur.right).includes(prev.stationCode)
    ) {
      result[result.length - 1].path.push([cur.latitude, cur.longitude]);
    } else {
      result.push({
        railwayCode: cur.railwayCode,
        railwayName: cur.railwayName,
        railwayColor: cur.railwayColor,
        companyName: cur.railwayCompany,
        path: [[cur.latitude, cur.longitude]],
        key: `${cur.date.toString()}|${cur.stationCode}`,
      });
    }
  }
  return result;
};

// 検索で用いるデータ
type SearchParams = {
  page: number;
  pagesize: number;
  comp: number | undefined;
  dateFrom: Dayjs | null;
  dateTo: Dayjs | null;
};

const HistoryMap = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigation = useNavigate();
  const params = new URLSearchParams(location.search);

  const [showPoint, setShowPoint] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    page: +(params.get("page") ?? 1),
    pagesize: +(params.get("pagesize") ?? 50),
    comp: Number(params.get("comp")) || undefined,
    dateFrom: params.get("dateFrom") ? dayjs(params.get("dateFrom")) : null,
    dateTo: params.get("dateTo") ? dayjs(params.get("dateTo")) : null,
  });

  const [popupInfo, setPopupInfo] = useState<{
    lng: number;
    lat: number;
    type: "line" | "point";
    railwayCode?: number;
    railwayName?: string;
    stationCode?: number;
    stationName?: string;
  } | null>(null);

  const historyListQuery = useStationHistoryListAndInfo();
  const historyList = historyListQuery.data;

  const companyListQuery = useCompanyList();

  useEffect(() => {
    navigation(`?${getURLSearchParams(searchParams).toString()}`, {
      replace: true,
    });
  }, [searchParams]);

  if (isLoading) {
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return <NotFound />;
  }

  if (historyListQuery.isError) {
    return (
      <Container>
        <Typography variant="h5">
          Error: {historyListQuery.error.message}
        </Typography>
      </Container>
    );
  }

  if (!historyList || !companyListQuery.data) {
    return (
      <Container>
        Loading...
        <CircularProgress />
      </Container>
    );
  }

  const companyList = [{ companyCode: 0, companyName: "JR" }].concat(
    companyListQuery.data
  );

  const filteredHistoryList = historyList
    .filter(
      (history) =>
        (searchParams.dateFrom?.toDate() ?? new Date(0)) <= history.date &&
        new Date(
          history.date.getFullYear(),
          history.date.getMonth(),
          history.date.getDay()
        ) <= (searchParams.dateTo?.toDate() ?? new Date("9999-12-31"))
    )
    .filter((history) =>
      searchParams.comp
        ? history.companyCode === companyList[searchParams.comp].companyCode
        : searchParams.comp !== undefined
        ? history.companyCode <= 6 // JR
        : true
    );

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="ja"
          dateFormats={{ year: "YYYY", month: "M月" }}
        >
          <DatePicker
            label="開始日"
            value={searchParams.dateFrom}
            onChange={(dateFrom) =>
              setSearchParams({ ...searchParams, dateFrom: dateFrom })
            }
            slotProps={{
              textField: { variant: "standard" },
              toolbar: { toolbarFormat: "YYYY年 M月" },
            }}
            format="YYYY-MM-DD"
            sx={{ display: "inline-block", width: 120, ml: 3 }}
            disableFuture
          />
          <DatePicker
            label="終了日"
            value={searchParams.dateTo}
            onChange={(dateTo) =>
              setSearchParams({ ...searchParams, dateTo: dateTo })
            }
            slotProps={{
              textField: { variant: "standard" },
              toolbar: { toolbarFormat: "YYYY年 M月" },
            }}
            format="YYYY-MM-DD"
            sx={{ display: "inline-block", width: 120, ml: 3 }}
            disableFuture
          />
        </LocalizationProvider>

        <FormControl variant="standard" sx={{ minWidth: 100, ml: 3 }}>
          <InputLabel id="filter-company-name-select">会社名</InputLabel>
          <Select
            id="filter-company-name-select"
            value={searchParams.comp?.toString() ?? ""}
            label="会社名"
            variant="standard"
            onChange={(e) =>
              setSearchParams({
                ...searchParams,
                comp: e.target.value !== "" ? +e.target.value : undefined,
              })
            }
          >
            <MenuItem value="">None</MenuItem>
            {companyList.map((company, idx) => (
              <MenuItem value={idx} key={company.companyCode}>
                {company.companyName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          color="inherit"
          onClick={() => setShowPoint(!showPoint)}
          sx={{ margin: "auto", ml: 2, mt: 2 }}
        >
          <Typography
            variant="h6"
            sx={{ fontSize: 14, display: "inline-block" }}
          >
            点を表示
          </Typography>
          <Checkbox size="small" checked={showPoint} sx={{ padding: 0 }} />
        </Button>
      </Box>

      <Box sx={{ mb: 2 }}>
        <CustomLink to="/history">
          <Typography variant="h6" sx={{ fontSize: 14 }}>
            履歴を見る
          </Typography>
        </CustomLink>
      </Box>
      <Map
        initialViewState={{
          longitude: 138.126471,
          latitude: 36.265185,
          zoom: 6,
        }}
        style={{ height: "90vh" }}
        mapStyle={import.meta.env.VITE_MAPBOX_STYLE_URL}
        mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
        interactiveLayerIds={["history-lines", "history-points"]}
        onClick={(e) => {
          const feature = e.features?.[0];
          if (!feature) {
            setPopupInfo(null);
            return;
          }
          const { lat, lng } = e.lngLat;
          const props = feature.properties;

          if (feature.layer?.id === "history-lines") {
            setPopupInfo({
              lng,
              lat,
              type: "line",
              railwayCode: props?.railwayCode,
              railwayName: props?.railwayName,
            });
          } else if (feature.layer?.id === "history-points") {
            setPopupInfo({
              lng,
              lat,
              type: "point",
              stationCode: props?.stationCode,
              stationName: props?.stationName,
            });
          }
        }}
      >
        <Source
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: splitHistoryList(filteredHistoryList).map((item) => ({
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: item.path.map((p) => [p[1], p[0]]),
              },
              properties: {
                railwayCode: item.railwayCode,
                railwayName: item.railwayName,
                railwayColor: item.railwayColor,
              },
            })),
          }}
        >
          <Layer
            id="history-lines"
            type="line"
            layout={{
              "line-join": "round",
              "line-cap": "round",
            }}
            paint={{
              "line-color": ["concat", "#", ["get", "railwayColor"]],
              "line-width": 5,
            }}
          />
        </Source>

        {showPoint && (
          <Source
            type="geojson"
            data={{
              type: "FeatureCollection",
              features: filteredHistoryList.map((info) => ({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [info.longitude, info.latitude],
                },
                properties: {
                  stationCode: info.stationCode,
                  stationName: info.stationName,
                },
              })),
            }}
          >
            <Layer
              id="history-points"
              type="circle"
              paint={{
                "circle-radius": 6,
                "circle-color": "white",
                "circle-stroke-color": "black",
                "circle-stroke-width": 2,
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
              {popupInfo.type === "line" ? (
                <Link to={"/railway/" + popupInfo.railwayCode}>
                  {popupInfo.railwayName}
                </Link>
              ) : (
                <Link to={"/station/" + popupInfo.stationCode}>
                  {popupInfo.stationName}
                </Link>
              )}
            </Box>
          </Popup>
        )}
      </Map>
    </Container>
  );
};

export default HistoryMap;
