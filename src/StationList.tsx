import React, { useState } from "react";
import {
  Box,
  CircularProgress,
  Container,
  TablePagination,
  Typography
} from "@mui/material";
import { StationGroup, useStationGroupList } from "./Api";

	
type Props = {
  data: StationGroup,
};

const StationGroupContent: React.FC<Props> = (props) => {
  const { data } = props;

  return (
    <Box sx={{ mb: 2 }} border={1} onClick={() => window.location.href = "/stationGroup/" + data.stationGroupCode}>
      <Typography variant="h6" sx={{ color: "gray" }}>駅名:</Typography>
      <Typography variant="h6" sx={{ mx: 2 }}>{data.stationName}</Typography>
    </Box>
  );
};

const StationList = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const stationGroupList = useStationGroupList(page * rowsPerPage, rowsPerPage);
  const stationGroupsInfo = stationGroupList.data;

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
        count={9036}
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
        <Pagination />
        Loading...
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Pagination />

      <Box sx={{ mb: 2 }}>
        {stationGroupsInfo?.map((item) => (
          <StationGroupContent key={item.stationGroupCode} data={item} />
        ))}
      </Box>

      <Pagination />
    </Container>
  );
};

export default StationList;
