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

const BinaryPagination = (
  { count, page, rowsPerPage, rowsPerPageOptions, onPageChange, onRowsPerPageChange, sx }
  :{
    count: number,
    page: number,
    rowsPerPage: number,
    rowsPerPageOptions: Array<number>,
    onPageChange: (page: number) => unknown,
    onRowsPerPageChange: (event: SelectChangeEvent) => unknown,
    sx?: SxProps<Theme>,
  }
): JSX.Element => {
  const pageNum = Math.ceil(count / rowsPerPage);
  let pages = [page];
  for(let i = 1; (1 << i) < page; i++){
    pages.push(page - (1 << i) + 1);
  }
  pages.push(1);
  for(let i = 1; page + (1 << i) - 1 < pageNum; i++){
    pages.push(page + (1 << i) - 1);
  }
  pages.push(pageNum);
  pages = Array.from(new Set(pages.sort((a, b) => a - b)));
  return (
    <Box sx={sx}>
      <Box sx={{ textAlign: "center" }}>
        {pages.map(index => (
          <Button
            key={index}
            variant={page === index ? "contained" : "outlined"}
            onClick={() => onPageChange(index)}
            sx={{ minWidth: 10, lineHeight: 1, paddingY: "8px", paddingX: "10px", borderRadius: 0 }}
          >
            {index}
          </Button>
        ))}
      </Box>
      <Box sx={{ textAlign: "right" }}>
        <Typography variant="h6" sx={{ display: "inline-block", mx: 2, fontSize: 14 }}>Rows Per Page</Typography>
        <Select
          labelId="RowsPerPage"
          id="RowsPerPage"
          value={rowsPerPage.toString()}
          label="Rows Per Page"
          size="small"
          onChange={onRowsPerPageChange}
        >
          {rowsPerPageOptions.map(value => (
            <MenuItem key={value} value={value}>{value}</MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );
};

export default BinaryPagination;
