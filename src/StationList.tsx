import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import { StationGroup, useStationGroupCount, useStationGroupList } from "./Api";

	
type Props = {
  data: StationGroup,
};

const StationList = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const stationGroupList = useStationGroupList(page * rowsPerPage, rowsPerPage);
  const stationGroupsInfo = stationGroupList.data;

  const stationGroupCount = useStationGroupCount();

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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

  if(stationGroupList.isLoading){
    return (
      <Container>
        {!stationGroupCount.isLoading && <Pagination />}
        Loading...
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
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
