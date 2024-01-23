import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  SxProps,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useSearchStationGroupCount, useSearchStationGroupList } from "./Api";


const StationList = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timer>();
  const [inputName, setInputName] = useState("");
  const [searchName, setSearchName] = useState("");

  const stationGroupList = useSearchStationGroupList({
    offset: (page-1) * rowsPerPage,
    length: rowsPerPage,
    name: searchName,
  });
  const stationGroupsInfo = stationGroupList.data;

  const stationGroupCount = useSearchStationGroupCount({ name: searchName });

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: SelectChangeEvent) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  // 500[ms]遅延して検索が更新される
  const handleChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputName(event.target.value);
    const text = event.target.value;
    clearInterval(timeoutId);
    setTimeoutId(
      setTimeout(() => setSearchName(text), 500)
    );
  };

  const Pagination = (
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


  if(stationGroupList.isError || stationGroupCount.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(stationGroupList.isLoading || stationGroupCount.isLoading){
    return (
      <Container>
        <TextField
          id="name"
          label="name"
          variant="standard"
          value={inputName}
          sx={{ maxWidth: "50%" }}
          onChange={handleChangeText}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        {!stationGroupCount.isLoading && <Pagination page={page} count={stationGroupCount.data!} rowsPerPage={rowsPerPage} rowsPerPageOptions={[10,25,50,100,200]} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}/>}
        <Box>
          Loading...
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <TextField
        id="name"
        label="name"
        variant="standard"
        value={inputName}
        sx={{ maxWidth: "50%" }}
        onChange={handleChangeText}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <Pagination page={page} count={stationGroupCount.data!} rowsPerPage={rowsPerPage} rowsPerPageOptions={[10,25,50,100,200]} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}/>
      
      <TableContainer component={Paper}>
        <Table sx={{}} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Group Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stationGroupsInfo?.map(item => (
              <TableRow key={item.stationGroupCode}>
                <TableCell>
                  <Link
                    color="primary"
                    to={"/stationGroup/" + item.stationGroupCode}
                    style={{ textDecoration: "none" }}
                  >
                    {item.stationGroupCode}
                  </Link>
                </TableCell>
                <TableCell>{item.stationName}</TableCell>
                <TableCell>{item.date?.toString() ?? ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Pagination page={page} count={stationGroupCount.data!} rowsPerPage={rowsPerPage} rowsPerPageOptions={[10,25,50,100,200]} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage}/>
    </Container>
  );
};

export default StationList;
