import React, { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  ListItemText,
} from "@mui/material";


type Props = {
  text: string,
  loading: boolean,
  timeLimit: number, // [sec]最終アクセスから一定時間制限する
  accessedTime: Date | string | undefined,
  onClick: () => unknown,
};

const AccessButton: React.FC<Props> = (props) => {
  const { text, loading, timeLimit, accessedTime, onClick } = props;
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
      sx={{ textAlign: "center" }}
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
