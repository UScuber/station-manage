import React, { useState } from "react";
import { Box, Collapse, IconButton, SxProps, Theme } from "@mui/material";
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from "@mui/icons-material";

const Collapser = ({
  buttonText,
  open,
  onClick,
  children,
  sx,
  collapseSx,
}: {
  buttonText?: React.ReactElement;
  open?: boolean;
  onClick?: () => unknown;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  collapseSx?: SxProps<Theme>;
}) => {
  if (open === undefined || onClick === undefined) {
    const [open, setOpen] = useState(false);

    return (
      <Box sx={sx}>
        <IconButton
          aria-label="expand row"
          onClick={() => setOpen(!open)}
          color="inherit"
          sx={{ padding: 0 }}
        >
          {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
          {buttonText && buttonText}
        </IconButton>
        <Collapse in={open} timeout="auto" sx={collapseSx} unmountOnExit>
          {children}
        </Collapse>
      </Box>
    );
  }

  return (
    <Box sx={sx}>
      <IconButton
        aria-label="expand row"
        onClick={onClick}
        color="inherit"
        sx={{ padding: 0 }}
      >
        {open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
        {buttonText && buttonText}
      </IconButton>
      <Collapse in={open} timeout="auto" sx={collapseSx} unmountOnExit>
        {children}
      </Collapse>
    </Box>
  );
};

export default Collapser;
