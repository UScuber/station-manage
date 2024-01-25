import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Box, Container } from "@mui/system";
import { Button, CircularProgress, Collapse, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { KeyboardArrowUp as KeyboardArrowUpIcon, KeyboardArrowDown as KeyboardArrowDownIcon } from "@mui/icons-material";
import { Station, StationGroup, useSendStationGroupStateMutation, useStationGroupInfo, useStationsInfoByGroupCode } from "./Api";
import AccessButton from "./components/AccessButton";
import AroundTime from "./components/AroundTime";


const StationItem = (
  { info }
  :{
    info: Station,
  }
): JSX.Element => {
  return (
    <Button
      component={Link}
      to={"/station/" + info.stationCode}
      variant="outlined"
      color="inherit"
      sx={{ display: "block", mb: 0.5, textTransform: "none" }}
    >
      <Typography variant="h6" sx={{ fontSize: 15, display: "inline-block" }}>{info?.railwayCompany}</Typography>
      <Typography variant="h6" sx={{ mx: 1, display: "inline-block" }}>{info?.railwayName}</Typography>

      <Typography variant="h6" sx={{ fontSize: 18 }}>乗降: <AroundTime date={info?.getDate?.toString() ?? "なし"}/></Typography>
      <Typography variant="h6" sx={{ fontSize: 18 }}>通過: <AroundTime date={info?.passDate?.toString() ?? "なし"}/></Typography>
    </Button>
  );
};

const StationGroupInfo = () => {
  const stationGroupCode = Number(useParams<"stationGroupCode">().stationGroupCode);

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const groupStations = useStationsInfoByGroupCode(stationGroupCode);
  const stationList = groupStations.data;
  const groupStationQuery = useStationGroupInfo(stationGroupCode, (data: StationGroup) => {
    setLoading(false);
  });
  const groupStationData = groupStationQuery.data;

  const mutation = useSendStationGroupStateMutation();

  const handleSubmit = () => {
    setLoading(true);

    mutation.mutate({
      stationGroupCode: stationGroupCode,
      date: new Date(),
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  if(groupStations.isError || groupStationQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(groupStations.isLoading || groupStationQuery.isLoading){
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
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <Typography variant="h3" sx={{ lineHeight: 1 }}>{groupStationData?.stationName}</Typography>
          <Typography variant="h6" sx={{ fontSize: 16 }}>{groupStationData?.kana}</Typography>
        </Box>
          <Typography variant="h6">{groupStationData?.prefName}</Typography>
        </Box>
        <Typography variant="h6" sx={{ display: "inline-block" }}>
          立ち寄り: <AroundTime date={groupStationData?.date?.toString() ?? "なし"}/>
        </Typography>
        <IconButton
          aria-label="expand row"
          onClick={() => setOpen(!open)}
        >
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ margin: 1 }}>
            <Typography variant="h6" component="div">
              History
            </Typography>
            <Table size="small" aria-label="dates">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupStationData?.date && (
                  <TableRow>
                    <TableCell>{groupStationData?.date?.toString() ?? ""}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Collapse>
        <AccessButton
          text="立ち寄り"
          loading={loading}
          timeLimit={60*3}
          accessedTime={groupStationData?.date?.toString()}
          onClick={handleSubmit}
          sx={{ mb: 2, display: "block" }}
        />
      <Box>
        {stationList?.map(item => (
          <StationItem key={item.stationCode} info={item} />
        ))}
      </Box>
    </Container>
  );
};

export default StationGroupInfo;
