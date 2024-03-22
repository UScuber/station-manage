import { styled } from "@mui/material";
import { Link } from "react-router-dom";

const CustomLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: "none",
  textTransform: "none",
}));

export default CustomLink;
