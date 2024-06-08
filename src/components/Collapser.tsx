import React, { useState } from "react";
import { Box, Collapse, IconButton, SxProps, Theme } from "@mui/material";
import {
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";


const Collapser = (
  { buttonText, children, sx, collapseSx }
  :{
    buttonText?: JSX.Element,
    children: React.ReactNode,
    sx?: SxProps<Theme>,
    collapseSx?: SxProps<Theme>,
  }
) => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={sx}>
      <IconButton
        aria-label="expand row"
        onClick={() => setOpen(!open)}
        color="inherit"
        sx={{ padding: 0 }}
      >
        {buttonText && buttonText}
        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
      </IconButton>
      <Collapse in={open} timeout="auto" sx={collapseSx} unmountOnExit>
        {children}
      </Collapse>
    </Box>
  );
};

export default Collapser;
