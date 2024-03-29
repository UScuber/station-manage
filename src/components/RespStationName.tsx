import { Typography, styled } from "@mui/material";

const RespStationName = styled(Typography)(({ theme, variant }) => {
  // 大きい駅名
  if(variant === "h3"){
    return {
      fontSize: 45,
      fontWeight: 500,
      [theme.breakpoints.down("md")]: {
        fontSize: 28,
        fontWeight: 600,
      },
    };
  }
  // 駅名
  if(variant === "h5"){
    return {
      fontSize: 22,
      [theme.breakpoints.down("md")]: {
        fontSize: 18,
      },
    };
  }
  // 読み仮名
  if(variant === "h6"){
    return {
      fontSize: 13,
      [theme.breakpoints.down("md")]: {
        fontSize: 11,
      },
    };
  }
  return {};
});

export default RespStationName;
