import { Box, CircularProgress, Typography } from "@mui/material";
import { StationProgress } from "../api/Api";


const CircleProgress = (
  { progress, size }
  :{
    progress: StationProgress,
    size: number,
  }
) => {
  return (
    <Box sx={{ position: "relative", display: "flex", height: size, alignItems: "center" }}>
      <CircularProgress
        variant="determinate"
        sx={{
          color: (theme) =>
            theme.palette.grey[theme.palette.mode === "light" ? 200 : 800],
        }}
        size={size}
        thickness={6}
        value={100}
      />
      <CircularProgress
        variant="determinate"
        size={size}
        thickness={6}
        value={progress.getOrPassStationNum / progress.stationNum * 100}
        sx={{ position: "absolute", left: 0 }}
      />
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{
          fontSize: 12,
          ml: 1,
          width: 48,
          height: 20,
          display: "inline-block",
        }}
      >
        {`${progress.getOrPassStationNum}/${progress.stationNum}`}
      </Typography>
    </Box>
  );
};

export default CircleProgress;
