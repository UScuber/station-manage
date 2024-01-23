import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Container,
  InputAdornment,
  Paper,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useSearchStationGroupCount, useSearchStationGroupList } from "./Api";
import BinaryPagination from "./components/BinaryPagination";


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

  const CustomPagination = (): JSX.Element => {
    return (
      <BinaryPagination
        page={page}
        count={stationGroupCount.data!}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[10,25,50,100,200]}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
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
        {!stationGroupCount.isLoading && <CustomPagination />}
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
      <CustomPagination />
      
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

      <CustomPagination />
    </Container>
  );
};

export default StationList;
