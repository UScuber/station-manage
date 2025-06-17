import { Box, LinearProgress, Typography, useTheme } from "@mui/material";
import { StationProgress } from "../api";

const ProgressBar = ({
  progress,
  ...others
}: {
  progress: StationProgress;
  [key: string]: unknown;
}) => {
  const theme = useTheme();
  return (
    <Box {...others}>
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{
          fontSize: 14,
          textAlign: "right",
        }}
      >
        {`${progress.getOrPassStationNum}/${progress.stationNum}`}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={(progress.getOrPassStationNum / progress.stationNum) * 100}
        color={
          progress.getOrPassStationNum === progress.stationNum
            ? "success"
            : "primary"
        }
      />
    </Box>
  );
};

export default ProgressBar;
