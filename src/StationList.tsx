import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  CircularProgress,
  Container,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useSearchStationGroupCount, useSearchStationGroupList } from "./Api";


const StationList = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [searchName, setName] = useState("");

  const stationGroupList = useSearchStationGroupList({
    offset: page * rowsPerPage,
    length: rowsPerPage,
    name: searchName,
  });
  const stationGroupsInfo = stationGroupList.data;

  const stationGroupCount = useSearchStationGroupCount({ name: searchName });

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const Pagination = (): JSX.Element => {
    return (
      <TablePagination
        component="div"
        count={stationGroupCount.data!}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10,25,50,100,200,500]}
      />
    );
  };


  if(stationGroupList.isLoading || stationGroupCount.isLoading){
    return (
      <Container>
        <TextField
          id="name"
          label="name"
          variant="standard"
          value={searchName}
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
        {!stationGroupCount.isLoading && <Pagination />}
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
        value={searchName}
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
      <Pagination />
      
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
                <TableCell>{item.date?.toDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Pagination />
    </Container>
  );
};

export default StationList;
