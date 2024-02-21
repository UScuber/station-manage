import { Link, useParams } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import { Station, useRailwayInfo, useStationsInfoByRailwayCode } from "./Api";
import AroundTime from "./components/AroundTime";


const StationItem = (
  { info }
  :{
    info: Station,
  }
): JSX.Element => {
  return (
    <Button
      component={Link}
      to={"/station/" + info.stationCode}
      variant="outlined"
      color="inherit"
      sx={{ display: "block", mb: 0.5, textTransform: "none" }}
    >
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6">{info?.stationName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 10, lineHeight: 1 }}>{info?.kana}</Typography>
      </Box>

      <Typography variant="h6" sx={{ fontSize: 14 }}>乗降:<AroundTime date={info?.getDate} invalidMsg="なし" fontSize={14} /></Typography>
      <Typography variant="h6" sx={{ fontSize: 14 }}>通過:<AroundTime date={info?.passDate} invalidMsg="なし" fontSize={14} /></Typography>
    </Button>
  );
};

const RailwayInfo = () => {
  const railwayCode = Number(useParams<"railwayCode">().railwayCode);

  const railway = useRailwayInfo(railwayCode);
  const stationsQuery = useStationsInfoByRailwayCode(railwayCode);

  const info = railway.data;
  const stationList = stationsQuery.data;

  if(railway.isError || stationsQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    )
  }

  if(railway.isLoading || stationsQuery.isLoading){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h3" sx={{ lineHeight: 1 }}>{info?.railwayName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 16 }}>{info?.railwayKana}</Typography>
      </Box>
      <Box>
        {stationList?.map(item => (
          <StationItem key={item.stationCode} info={item} />
        ))}
      </Box>
    </Container>
  )
};

export default RailwayInfo;
