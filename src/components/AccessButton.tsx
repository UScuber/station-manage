import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  ListItemText,
  SxProps,
  Theme,
} from "@mui/material";

type Props = {
  text: string;
  loading: boolean;
  timeLimit: number; // [sec]最終アクセスから一定時間制限する
  accessedTime: Date | undefined;
  onClick: () => unknown;
  sx?: SxProps<Theme>;
};

const AccessButton = (props: Props): React.ReactElement => {
  const { text, loading, timeLimit, accessedTime, onClick, sx } = props;
  const [disabled, setDisabled] = useState(() => {
    const waitTime =
      timeLimit * 1000 -
      (new Date().getTime() - new Date(accessedTime ?? 0).getTime());
    return waitTime > 0;
  });

  useEffect(() => {
    if (!accessedTime) {
      setDisabled(false);
      return;
    }
    const waitTime =
      timeLimit * 1000 -
      (new Date().getTime() - new Date(accessedTime).getTime());
    if (waitTime <= 0) {
      setDisabled(false);
      return;
    }
    setDisabled(true);
    const timeoutId = setTimeout(() => setDisabled(false), waitTime);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [accessedTime, timeLimit]);

  return (
    <Box sx={{ m: 1 }}>
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <Button
          variant="outlined"
          onClick={onClick}
          disabled={disabled || loading}
          sx={sx}
        >
          {text}
        </Button>
        {loading && (
          <CircularProgress
            size={30}
            sx={{
              position: "absolute",
              color: (theme) => theme.palette.action.disabled,
              top: "50%",
              left: "50%",
              marginTop: "-15px",
              marginLeft: "-15px",
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default AccessButton;
