import React, { useState } from "react";
import { Box, Button, CircularProgress, Container, Toolbar, Typography } from "@mui/material";
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
  const [contentsNum, setContentsNum] = useState(20);

  const stationGroupList = useStationGroupList(page * contentsNum, contentsNum);
  const stationGroupsInfo = stationGroupList.data;

  const handleNextPage = () => {
    setPage(page + 1);
  };
  const handlePrevPage = () => {
    setPage(Math.max(page - 1, 0));
  };

  if(stationGroupList.isLoading){
    return (
      <Container>
        Loading...
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mb: 2 }}>
        {stationGroupsInfo?.map((item, index) => (
          <StationGroupContent key={index} data={item} />
        ))}
      </Box>
      <Box>
        <Button onClick={() => handlePrevPage()}>
          Prev
        </Button>
        <Button onClick={() => handleNextPage()}>
          Next
        </Button>
      </Box>
    </Container>
  );
};

export default StationList;
