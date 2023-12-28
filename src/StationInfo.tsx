import { useParams } from "react-router-dom";
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
      <Typography variant="h3" sx={{ mb: 2 }}>{info?.stationName}</Typography>
      <Box>
        <Typography variant="h6" sx={{ color: "gray" }}>駅コード:</Typography>
        <Typography variant="h6" sx={{ mx: 2 }}>{info?.stationCode}</Typography>

        <Typography variant="h6" sx={{ color: "gray" }}>路線名:</Typography>
        <Typography variant="h6" sx={{ mx: 2 }}>{info?.railwayName}</Typography>

        <Typography variant="h6" sx={{ color: "gray" }}>路線運営会社:</Typography>
        <Typography variant="h6" sx={{ mx: 2 }}>{info?.railwayCompany}</Typography>

        <Typography variant="h6" sx={{ color: "gray" }}>座標:</Typography>
        <Typography variant="h6" sx={{ mx: 2 }}>緯度: {info?.latitude}, 経度: {info?.longitude}</Typography>

        <Typography variant="h6" sx={{ color: "gray" }}>最終アクセス:</Typography>
        <Box sx={{ mx: 2 }}>
          <Typography variant="h6">乗降: {getDate}</Typography>
          <Typography variant="h6">通過: {passDate}</Typography>
        </Box>
      </Box>
      <Box>
        <Stack spacing={2} direction="row">
          {stateNames.map((value, index) => (
            <Button key={value} variant="outlined" onClick={() => handleSubmit(index)} sx={{ textAlign: "center" }}>
              <ListItemText primary={value} />
            </Button>
          ))}
        </Stack>
      </Box>
    </Container>
  );
};

export default StationInfo;
