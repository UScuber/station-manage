import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Box, Container } from "@mui/system";
import {
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import {
  RecordState,
  Station,
  StationGroup,
  StationHistoryData,
  useDeleteStationGroupHistoryMutation,
  useDeleteStationHistoryMutation,
  useSendStationGroupStateMutation,
  useStationGroupAllHistory,
  useStationGroupInfo,
  useStationsInfoByGroupCode,
} from "./Api";
import AccessButton from "./components/AccessButton";
import AroundTime from "./components/AroundTime";
import getDateString from "./utils/getDateString";


const stateName = ["乗降", "通過", "立ち寄り"];

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

      <Typography variant="h6" sx={{ fontSize: 18 }}>乗降: <AroundTime date={info?.getDate} invalidMsg="なし" /></Typography>
      <Typography variant="h6" sx={{ fontSize: 18 }}>通過: <AroundTime date={info?.passDate} invalidMsg="なし" /></Typography>
    </Button>
  );
};

const StationGroupInfo = () => {
  const stationGroupCode = Number(useParams<"stationGroupCode">().stationGroupCode);

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const groupStations = useStationsInfoByGroupCode(stationGroupCode);
  const stationList = groupStations.data;
  const groupStationQuery = useStationGroupInfo(stationGroupCode, (data: StationGroup) => {
    setLoading(false);
  });
  const groupStationData = groupStationQuery.data;

  const stationGroupAllHistoryQuery = useStationGroupAllHistory(stationGroupCode, (data: StationHistoryData[]) => {
    setDeleteLoading(false);
  });
  const stationGroupAllHistory = stationGroupAllHistoryQuery.data;

  const sendMutation = useSendStationGroupStateMutation();
  const deleteStationHistoryMutation = useDeleteStationHistoryMutation();
  const deleteStationGroupHistoryMutation = useDeleteStationGroupHistoryMutation();

  const handleSubmit = () => {
    setLoading(true);

    sendMutation.mutate({
      stationGroupCode: stationGroupCode,
      date: new Date(),
    });
  };

  const handleDeleteHistory = (history: StationHistoryData) => {
    if(history.state === RecordState.Get || history.state === RecordState.Pass){
      deleteStationHistoryMutation.mutate({
        stationCode: history.stationCode!,
        stationGroupCode: history.stationGroupCode,
        date: history.date,
        state: history.state,
      });
    }else{
      deleteStationGroupHistoryMutation.mutate({
        stationGroupCode: history.stationGroupCode,
        date: history.date,
      });
    }
    setDeleteLoading(true);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);


  if(groupStations.isError || groupStationQuery.isError || stationGroupAllHistoryQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(groupStations.isLoading || groupStationQuery.isLoading || stationGroupAllHistoryQuery.isLoading){
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
          立ち寄り: <AroundTime date={groupStationData?.date} invalidMsg="なし" />
        </Typography>
        <IconButton
          aria-label="expand row"
          onClick={() => setOpen(!open)}
        >
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ margin: 1 }}>
            <Typography variant="h6" component="div">History</Typography>
            <Table size="small" aria-label="dates">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Railway</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {stationGroupAllHistory?.map(history => (
                  <TableRow key={`${history.date}|${history.state}`}>
                    <TableCell>{getDateString(history.date)}</TableCell>
                    <TableCell>{stateName[history.state]}</TableCell>
                    <TableCell>{history.railwayName ?? ""}</TableCell>
                    <TableCell>
                      <IconButton
                        aria-label="delete"
                        size="small"
                        onClick={() => handleDeleteHistory(history)}
                        disabled={deleteLoading}
                      >
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Collapse>

        <AccessButton
          text="立ち寄り"
          loading={loading}
          timeLimit={60*3}
          accessedTime={groupStationData?.date}
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
