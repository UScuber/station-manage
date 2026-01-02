import { Link } from "react-router-dom";
import { styled } from "@mui/material";

const CustomLink = styled(Link)(({ theme, color }) => ({
  color: color ?? theme.palette.primary.main,
  textDecoration: "none",
  textTransform: "none",
}));

export default CustomLink;
