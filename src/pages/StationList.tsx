import React, { useState } from "react";
import {
  Box,
  CircularProgress,
  Collapse,
  Container,
  IconButton,
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
import { Search as SearchIcon, KeyboardArrowUp as KeyboardArrowUpIcon, KeyboardArrowDown as KeyboardArrowDownIcon } from "@mui/icons-material";
import { StationGroup, useLatestStationGroupHistory, useSearchStationGroupCount, useSearchStationGroupList } from "../api/Api";
import { AroundTime, BinaryPagination, CustomLink } from "../components";
import getDateString from "../utils/getDateString";
import { useAuth } from "../auth/auth";


const Row = ({ info, isAuthenticated }: { info: StationGroup, isAuthenticated: boolean }): JSX.Element => {
  const [open, setOpen] = useState(false);

  const latestDateQuery = useLatestStationGroupHistory(isAuthenticated ? info.stationGroupCode : undefined);
  const latestDate = latestDateQuery.data;

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell sx={{ paddingLeft: 1.5, paddingRight: 0 }}>
          <CustomLink
            to={"/stationGroup/" + info.stationGroupCode}
          >
            <Typography variant="h6" sx={{ fontSize: 15, lineHeight: 1.3 }}>{info.stationName}</Typography>
            <Typography variant="h6" sx={{ fontSize: 9, lineHeight: 1 }}>{info.kana}</Typography>
          </CustomLink>
        </TableCell>
        <TableCell align="center" sx={{ paddingX: 0.5 }}>
          <CustomLink color="inherit" to={"/pref/" + info.prefCode}>
            <Typography sx={{ fontSize: 12, maxWidth: 50 }}>{info.prefName}</Typography>
          </CustomLink>
        </TableCell>
        {isAuthenticated && (<>
          <TableCell align="center" sx={{ paddingX: 0.5 }}>
            <AroundTime date={latestDate?.date} invalidMsg="" disableMinute fontSize={14}/>
          </TableCell>
          <TableCell align="center" sx={{ paddingLeft: 0, paddingRight: 1.5 }}>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </TableCell>
        </>)}
        </TableRow>
        {isAuthenticated && (
          <TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
              <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{ margin: 1 }}>
                  <Typography variant="h6" gutterBottom component="div">History</Typography>
                  <Table size="small" aria-label="purchases">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {latestDate?.date && (
                        <TableRow>
                          <TableCell>{getDateString(latestDate.date)}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Box>
              </Collapse>
            </TableCell>
          </TableRow>
        )}
    </>
  );
};

const StationList = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timer>();
  const [inputName, setInputName] = useState("");
  const [searchName, setSearchName] = useState("");

  const { isAuthenticated, isLoading } = useAuth();

  const stationGroupCount = useSearchStationGroupCount({ name: searchName });

  const stationGroupList = useSearchStationGroupList({
    offset: (page-1) * rowsPerPage,
    length: Math.min(rowsPerPage, (stationGroupCount.data ?? 1e9) - (page-1) * rowsPerPage),
    name: searchName,
  });
  const stationGroupsInfo = stationGroupList.data;

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: SelectChangeEvent) => {
    setRowsPerPage(+event.target.value);
    setPage(1);
  };

  // 500[ms]遅延して検索が更新される
  const handleChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputName(event.target.value);
    const text = event.target.value;
    clearInterval(timeoutId as unknown as number);
    setTimeoutId(
      setTimeout(() => {
        setSearchName(text);
        setPage(1);
      }, 500)
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
        sx={{ my: 1 }}
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

  if(!stationGroupsInfo || stationGroupCount.data === undefined){
    return (
      <Container>
        <TextField
          id="stationName"
          label="station name"
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
        {stationGroupCount.data !== undefined && <CustomPagination />}
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
        id="stationName"
        label="station name"
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
        <Table aria-label="collapsible table" size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ paddingLeft: 1.5, paddingRight: 0.5 }}>駅名</TableCell>
              <TableCell sx={{ minWidth: 75, paddingX: 0.5 }}>都道府県</TableCell>
              {isAuthenticated && <TableCell align="center" sx={{ minWidth: 75, paddingX: 0.5 }}>立ち寄り</TableCell>}
              {isAuthenticated && <TableCell align="center" sx={{ paddingLeft: 0, paddingRight: 1.5 }}>詳細</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {stationGroupsInfo.map(item => (
              <Row key={item.stationGroupCode} info={item} isAuthenticated={isAuthenticated} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CustomPagination />
    </Container>
  );
};

export default StationList;
