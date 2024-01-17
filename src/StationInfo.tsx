import { Link, useParams } from "react-router-dom";
import { useSendStationStateMutation, useStationInfo } from "./Api";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
  ListItemText,
  Stack,
} from "@mui/material";

const stateNames = ["乗降", "通過"];

const StationInfo = () => {
  const stationCode = Number(useParams<"stationCode">().stationCode);

  const station = useStationInfo(stationCode);
  const info = station.data;

  const getDate = info?.getDate?.toString() ?? "なし";
  const passDate = info?.passDate?.toString() ?? "なし";

  const mutation = useSendStationStateMutation();

  const handleSubmit = (state: number) => {
    mutation.mutate({
      stationCode: stationCode,
      state: state,
      date: new Date(),
    });
  };


  if(station.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(station.isLoading){
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
        <Typography variant="h3">{info?.stationName}</Typography>
        <Typography variant="h6" sx={{ fontSize: 16, mb: 1 }}>{info?.kana}</Typography>
        <Typography variant="h6">{info?.prefName}</Typography>
      </Box>
      <Box>
        <Typography variant="h6" sx={{ color: "gray" }}>駅コード:</Typography>
        <Typography variant="h6" sx={{ mx: 2 }}>{info?.stationCode}</Typography>

        <Typography variant="h6" sx={{ color: "gray" }}>路線運営会社:</Typography>
        <Typography variant="h6" sx={{ mx: 2 }}>{info?.railwayCompany}</Typography>

        <Typography variant="h6" sx={{ color: "gray" }}>路線名:</Typography>
        <Typography variant="h6" sx={{ mx: 2 }}>{info?.railwayName}</Typography>

        <Typography variant="h6" sx={{ color: "gray" }}>最終アクセス:</Typography>
        <Box sx={{ mx: 2 }}>
          <Typography variant="h6">乗降: {getDate}</Typography>
          <Typography variant="h6">通過: {passDate}</Typography>
        </Box>
      </Box>
      <Box>
        <Stack spacing={2} direction="row" sx={{ mb: 2 }}>
          {stateNames.map((value, index) => (
            <Button key={value} variant="outlined" onClick={() => handleSubmit(index)} sx={{ textAlign: "center" }}>
              <ListItemText primary={value} />
            </Button>
          ))}
        </Stack>
        <Button href={"/stationGroup/" + info?.stationGroupCode} variant="outlined">
          <ListItemText primary="駅グループ" />
        </Button>
      </Box>
    </Container>
  );
};

export default StationInfo;
