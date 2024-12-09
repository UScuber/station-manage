import { Link, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  LinearProgress,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Railway,
  StationProgress,
  useCompanyInfo,
  useCompanyProgress,
  useRailPathByCompanyCode,
  useRailwayProgressListByCompanyCode,
  useRailwaysInfoByCompanyCode,
  useStationsInfoByCompanyCode,
} from "../api";
import {
  CircleProgress,
  CustomLink,
  FitMapZoom,
  MapCustom,
  StationMapGeojson,
} from "../components";


const RailwayItem = ({ info, progress }: { info: Railway, progress: StationProgress | undefined }): JSX.Element => {
  const theme = useTheme();
  const achieve_rate = progress ? progress.getOrPassStationNum / progress.stationNum * 100 : undefined;

  return (
    <Button
      component={Link}
      to={"/railway/" + info.railwayCode}
      variant="outlined"
      color="inherit"
      sx={{
        display: "block",
        mb: 0.5,
        background: achieve_rate ? `linear-gradient(to right, ${theme.palette.access.main} ${achieve_rate}%, transparent ${achieve_rate}%)` : "none",
      }}
    >
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography
            variant="h6"
            sx={{
              display: "inline-block",
              mr: 2,
              textDecoration: "underline",
              textDecorationColor: "#" + info.railwayColor,
              textDecorationThickness: 3,
            }}
          >
            {info.railwayName}
          </Typography>
          {progress && (<CircleProgress size={25} progress={progress} />)}
        </Box>
        <Typography variant="h6" sx={{ fontSize: 16 }}>{info.formalName}</Typography>
      </Box>
    </Button>
  );
};


const CompanyInfo = () => {
  const companyCode = Number(useParams<"companyCode">().companyCode);

  const companyQuery = useCompanyInfo(companyCode);
  const info = companyQuery.data;

  const railwaysQuery = useRailwaysInfoByCompanyCode(companyCode);
  const railwayList = railwaysQuery.data;

  const railwayProgressQuery = useRailwayProgressListByCompanyCode(companyCode);
  const railwayProgress = railwayProgressQuery.data;
  const companyProgressQuery = useCompanyProgress(companyCode);
  const companyProgress = companyProgressQuery.data;

  const stationsQuery = useStationsInfoByCompanyCode(companyCode);
  const stationList = stationsQuery.data;

  const railwayPathQuery = useRailPathByCompanyCode(companyCode);
  const railwayPath = railwayPathQuery.data;

  if(companyQuery.isError || railwaysQuery.isError || stationsQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(!info || !railwayList || !stationList){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  const centerPosition = stationList.reduce((totPos, item) => ({
    lat: totPos.lat + item.latitude / stationList.length,
    lng: totPos.lng + item.longitude / stationList.length,
  }), { lat: 0, lng: 0 });

  const stationsPositionMap = (() => {
    let codeMap: { [key: number]: { lat: number, lng: number } } = {};
    stationList.forEach(item => {
      codeMap[item.stationCode] = { lat: item.latitude, lng: item.longitude };
    });
    return codeMap;
  })();

  return (
    <Container>
      <Box>
        <Typography variant="h3">{info.companyName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 16, mb: 0.5 }}>{info.formalName}</Typography>
        <CustomLink to="/company">
          <Typography variant="h6" sx={{ fontSize: 14 }}>会社一覧</Typography>
        </CustomLink>
      </Box>

      {companyProgress && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              fontSize: 14,
              textAlign: "right",
            }}
          >
            {`${companyProgress.getOrPassStationNum}/${companyProgress.stationNum}`}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={companyProgress.getOrPassStationNum / companyProgress.stationNum * 100}
          />
        </Box>
      )}

      <Box>
        {railwayList.map((item, idx) => (
          <RailwayItem
            info={item}
            progress={railwayProgress ? railwayProgress[idx] : undefined}
            key={item.railwayCode}
          />
        ))}
      </Box>

      <MapCustom center={centerPosition} zoom={10} style={{ height: "80vh" }}>
        {railwayPath && (
          <StationMapGeojson railwayPath={railwayPath} stationList={stationList} />
        )}
        <FitMapZoom
          positions={Object.keys(stationsPositionMap).map(key => stationsPositionMap[Number(key)])}
        />
      </MapCustom>
    </Container>
  );
};

export default CompanyInfo;
