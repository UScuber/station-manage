import { useState } from "react";
import { Link } from "react-router-dom";
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
import { CircleMarker, FeatureGroup, Polyline, Popup } from "react-leaflet";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import {
  StationHistoryDetail,
  useCompanyList,
  useStationHistoryListAndInfo,
} from "../api";
import { useAuth } from "../auth";
import { CustomLink, MapCustom } from "../components";
import NotFound from "./NotFound";

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

const HistoryMap = () => {
  const { isAuthenticated } = useAuth();
  const [showPoint, setShowPoint] = useState(false);
  const [dateFrom, setFromDate] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [selectCompany, setSelectCompany] = useState<number>();

  const historyListQuery = useStationHistoryListAndInfo();
  const historyList = historyListQuery.data;

  const companyListQuery = useCompanyList();

  if (!isAuthenticated) {
    return <NotFound />;
  }

  if (historyListQuery.isError) {
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if (!historyList || !companyListQuery.data) {
    return (
      <Container>
        Loading ...
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
        (dateFrom?.toDate() ?? new Date(0)) <= history.date &&
        new Date(
          history.date.getFullYear(),
          history.date.getMonth(),
          history.date.getDay()
        ) <= (dateTo?.toDate() ?? new Date("9999-12-31"))
    )
    .filter((history) =>
      selectCompany
        ? history.companyCode === companyList[+selectCompany].companyCode
        : selectCompany !== undefined
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
            value={dateFrom}
            onChange={(dateFrom) => setFromDate(dateFrom)}
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
            value={dateTo}
            onChange={(dateTo) => setDateTo(dateTo)}
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
            value={selectCompany?.toString() ?? ""}
            label="会社名"
            variant="standard"
            onChange={(e) =>
              setSelectCompany(
                e.target.value !== "" ? +e.target.value : undefined
              )
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

      <MapCustom
        center={[36.265185, 138.126471]}
        zoom={6}
        style={{ height: "90vh" }}
      >
        {splitHistoryList(filteredHistoryList).map((item) => (
          <FeatureGroup
            pathOptions={{ color: "#" + item.railwayColor }}
            key={item.key}
          >
            <Popup>
              <Box sx={{ textAlign: "center" }}>
                <Link to={"/railway/" + item.railwayCode}>
                  {item.railwayName}
                </Link>
              </Box>
            </Popup>
            <Polyline weight={5} positions={item.path} />
          </FeatureGroup>
        ))}
        {showPoint &&
          filteredHistoryList.map((info) => (
            <CircleMarker
              center={[info.latitude, info.longitude]}
              pathOptions={{
                color: "black",
                weight: 2,
                fillColor: "white",
                fillOpacity: 1,
              }}
              radius={6}
              key={`${info.stationCode}|${info.date}|${info.state}`}
            >
              <Popup>
                <Box sx={{ textAlign: "center" }}>
                  <Link to={"/station/" + info.stationCode}>
                    {info.stationName}
                  </Link>
                </Box>
              </Popup>
            </CircleMarker>
          ))}
      </MapCustom>
    </Container>
  );
};

export default HistoryMap;
