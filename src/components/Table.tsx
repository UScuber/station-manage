import { Box, SxProps, Theme } from "@mui/material";
import { ReactElement, ReactNode } from "react";

export const TableCell = ({
  children,
  sx,
  ...others
}: {
  children?: ReactNode;
  sx?: SxProps<Theme>;
}) => {
  return (
    <Box sx={{ padding: "16px", ...sx }} {...others}>
      {children}
    </Box>
  );
};

export const TableHead = ({
  children,
}: {
  children: ReactElement<typeof TableRow>;
}) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "subgrid",
        gridColumn: "span 2",
        gridAutoFlow: "column",
      }}
    >
      {children}
    </Box>
  );
};

export const TableRow = ({
  children,
  sx,
  ...others
}: {
  children: ReactElement<typeof TableCell>[];
  sx?: SxProps<Theme>;
}) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "subgrid",
        gridColumn: "span 2",
        gridAutoFlow: "column",
        alignItems: "center",
        borderBottom: "1px solid",
        borderColor: "divider",
        width: "100%",
        ...sx,
      }}
      {...others}
    >
      {children}
    </Box>
  );
};

export const TableBody = ({
  children,
  ...others
}: {
  children: ReactElement<typeof TableRow>[];
}) => {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, auto)",
        flexDirection: "column",
        width: "100%",
      }}
      {...others}
    >
      {children}
    </Box>
  );
};

export const Table = ({
  children,
  sx,
  ...others
}: {
  children: [ReactElement<typeof TableHead>, ReactElement<typeof TableBody>];
  sx?: SxProps<Theme>;
}) => {
  return (
    <Box
      sx={{
        overflowX: "auto",
        boxShadow: 1,
        borderRadius: 1,
        ...sx,
      }}
      {...others}
    >
      {children[0]}
      {children[1]}
    </Box>
  );
};
