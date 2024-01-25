import { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  ListItemText,
  SxProps,
  Theme,
} from "@mui/material";


type Props = {
  text: string,
  loading: boolean,
  timeLimit: number, // [sec]最終アクセスから一定時間制限する
  accessedTime: Date | undefined,
  onClick: () => unknown,
  sx?: SxProps<Theme>,
};

const AccessButton = (props: Props): JSX.Element => {
  const { text, loading, timeLimit, accessedTime, onClick, sx } = props;
  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    const waitTime = timeLimit*1000 - (new Date().getTime() - new Date(accessedTime ?? 0).getTime());
    if(waitTime <= 0){
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
    <Button
      variant="outlined"
      onClick={onClick}
      disabled={disabled || loading}
      sx={sx}
    >
      {loading ?
        <CircularProgress color="inherit" size={30}/>
        :
        <ListItemText primary={text} />
      }
    </Button>
  );
};

export default AccessButton;
