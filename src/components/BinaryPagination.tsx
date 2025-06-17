import { useCallback, useEffect, useRef } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";

// 0ページの時は1ページ目を開いている状態にして、内容は空にする
const BinaryPagination = ({
  count,
  page,
  rowsPerPage,
  rowsPerPageOptions,
  onPageChange,
  onRowsPerPageChange,
  sx,
}: {
  count: number;
  page: number; // 1-indexed
  rowsPerPage: number;
  rowsPerPageOptions: Array<number>;
  onPageChange: (page: number) => unknown;
  onRowsPerPageChange: (event: SelectChangeEvent) => unknown;
  sx?: SxProps<Theme>;
}): JSX.Element => {
  const pageNum = Math.max(Math.ceil(count / rowsPerPage), 1);
  const rightKeyRef = useRef(false);
  const leftKeyRef = useRef(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && !e.altKey && !leftKeyRef.current) {
        leftKeyRef.current = true;
        if (page > 1) onPageChange(page - 1);
      }
      if (e.key === "ArrowRight" && !e.altKey && !rightKeyRef.current) {
        rightKeyRef.current = true;
        if (page < pageNum) onPageChange(page + 1);
      }
    },
    [onPageChange, page, pageNum]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") leftKeyRef.current = false;
    if (e.key === "ArrowRight") rightKeyRef.current = false;
  }, []);

  // キー操作によるページ移動
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    // ページ数が変わったときに現在のページが範囲外ならば、最後のページに移動
    if (page > pageNum) {
      onPageChange(pageNum);
    }
  }, [page, pageNum, onPageChange]);

  const pages = Array.from(
    new Set(
      [1, page, pageNum]
        .concat(
          [...Array(Math.floor(Math.log2(page)) + 1).keys()].map(
            (v) => page - (1 << v) + 1
          )
        )
        .concat(
          [
            ...Array(
              Math.floor(Math.log2(Math.max(1, pageNum - page + 1))) + 1
            ).keys(),
          ].map((v) => page + (1 << v) - 1)
        )
        .sort((a, b) => a - b)
    )
  );

  return (
    <Box sx={sx}>
      <Box sx={{ textAlign: "center" }}>
        {pages.map((index) => (
          <Button
            key={index}
            variant={page === index ? "contained" : "outlined"}
            onClick={() => onPageChange(index)}
            sx={{
              minWidth: 10,
              lineHeight: 1,
              paddingY: "8px",
              paddingX: "10px",
              borderRadius: 0,
            }}
          >
            {index}
          </Button>
        ))}
      </Box>
      <Box sx={{ textAlign: "right" }}>
        <Typography
          variant="h6"
          sx={{ display: "inline-block", mx: 1, fontSize: 14 }}
        >
          Per page:
        </Typography>
        <Select
          variant="standard"
          labelId="RowsPerPage"
          id="RowsPerPage"
          value={rowsPerPage.toString()}
          label="Rows Per Page"
          size="small"
          onChange={onRowsPerPageChange}
          sx={{ maxHeight: 24 }}
        >
          {rowsPerPageOptions.map((value) => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
        <Typography
          variant="h6"
          sx={{ display: "inline-block", mx: 1, fontSize: 15 }}
        >
          {(page - 1) * rowsPerPage + 1}–{Math.min(page * rowsPerPage, count)}{" "}
          of {count}
        </Typography>
      </Box>
    </Box>
  );
};

export default BinaryPagination;
