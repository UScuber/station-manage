import React, { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
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
import {
  Search as SearchIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
} from "@mui/icons-material";
import {
  StationGroup,
  StationGroupDate,
  useSearchStationGroupCount,
  useSearchStationGroupList,
  useSearchStationGroupListHistory,
} from "../api";
import { useAuth } from "../auth";
import { AroundTime, BinaryPagination, CustomLink } from "../components";
import { useLocation, useNavigate } from "react-router-dom";
import getURLSearchParams from "../utils/getURLSearchParams";

const Row = ({
  info,
  latestDate,
}: {
  info: StationGroup;
  latestDate: StationGroupDate | undefined;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell sx={{ paddingLeft: 1.5, paddingRight: 0, width: "50%" }}>
          <CustomLink to={"/stationGroup/" + info.stationGroupCode}>
            <Typography variant="h6" sx={{ fontSize: 15, lineHeight: 1.3 }}>
              {info.stationName}
            </Typography>
            <Typography variant="h6" sx={{ fontSize: 9, lineHeight: 1 }}>
              {info.kana}
            </Typography>
          </CustomLink>
        </TableCell>
        <TableCell align="center" sx={{ paddingX: 0.5 }}>
          <CustomLink color="inherit" to={"/pref/" + info.prefCode}>
            <Typography sx={{ fontSize: 12, maxWidth: 50 }}>
              {info.prefName}
            </Typography>
          </CustomLink>
        </TableCell>
        {latestDate && (
          <>
            <TableCell align="center" sx={{ paddingX: 0.5 }}>
              <AroundTime
                date={latestDate?.date}
                invalidMsg=""
                disableMinute
                fontSize={14}
              />
            </TableCell>
            <TableCell
              align="center"
              sx={{ paddingLeft: 0, paddingRight: 1.5 }}
            >
              <IconButton
                aria-label="expand row"
                size="small"
                onClick={() => setOpen(!open)}
              >
                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            </TableCell>
          </>
        )}
      </TableRow>
      {/* {latestDate && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="h6" gutterBottom component="div">
                  History
                </Typography>
                <Table size="small">
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
      )} */}
    </>
  );
};

// 検索で用いるデータ
type SearchParams = {
  name: string;
  page: number;
  pagesize: number;
};

const StationList = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigation = useNavigate();
  const params = new URLSearchParams(location.search);

  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | undefined>();
  const [inputName, setInputName] = useState(params.get("name") ?? "");
  const getSearchParams = () => ({
    name: params.get("name") ?? "",
    page: +(params.get("page") ?? 1),
    pagesize: +(params.get("pagesize") ?? 50),
  });
  const [searchParams, setSearchParams] = useState(getSearchParams);

  const stationGroupCount = useSearchStationGroupCount({
    name: searchParams.name,
  });

  const stationGroupList = useSearchStationGroupList({
    offset: (searchParams.page - 1) * searchParams.pagesize,
    length: Math.min(
      searchParams.pagesize,
      (stationGroupCount.data ?? 1e9) -
        (searchParams.page - 1) * searchParams.pagesize
    ),
    name: searchParams.name,
  });
  const stationGroupsInfo = stationGroupList.data;

  const latestHistoryListQuery = useSearchStationGroupListHistory({
    offset: (searchParams.page - 1) * searchParams.pagesize,
    length: Math.min(
      searchParams.pagesize,
      (stationGroupCount.data ?? 1e9) -
        (searchParams.page - 1) * searchParams.pagesize
    ),
    name: searchParams.name,
  });
  const latestHistoryList = latestHistoryListQuery.data;

  const handleChangePage = (newPage: number) => {
    setSearchParams({
      ...searchParams,
      page: newPage,
    });
  };
  const handleChangeRowsPerPage = (event: SelectChangeEvent) => {
    setSearchParams({
      ...searchParams,
      pagesize: +event.target.value,
      page: 1,
    });
  };

  // 500[ms]遅延して検索が更新される
  const handleChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setInputName(text);
    if (timeoutId) clearTimeout(timeoutId);
    setTimeoutId(
      setTimeout(() => {
        setSearchParams({
          ...searchParams,
          name: text,
          page: 1,
        });
      }, 500)
    );
  };

  const CustomPagination = () => {
    return (
      <BinaryPagination
        page={searchParams.page}
        count={stationGroupCount.data!}
        rowsPerPage={searchParams.pagesize}
        rowsPerPageOptions={[10, 25, 50, 100, 200]}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ my: 1 }}
      />
    );
  };

  // ブラウザバックなどでURLが変更されたとき
  useEffect(() => {
    if (params.toString() !== getURLSearchParams(searchParams).toString()) {
      setSearchParams(getSearchParams);
      setInputName(params.get("name") ?? "");
    }
  }, [location.search]);

  // クエリパラメータの更新
  useEffect(() => {
    navigation(`?${getURLSearchParams(searchParams).toString()}`, {
      replace: true,
    });
  }, [searchParams]);

  if (stationGroupList.isError || stationGroupCount.isError) {
    return (
      <Container>
        <Typography variant="h5">
          Error:{" "}
          {stationGroupList.error?.message || stationGroupCount.error?.message}
        </Typography>
      </Container>
    );
  }

  if (!stationGroupsInfo || stationGroupCount.data === undefined) {
    return (
      <Container>
        <TextField
          id="stationName"
          label="駅名"
          variant="standard"
          value={inputName}
          sx={{ maxWidth: "50%" }}
          onChange={handleChangeText}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
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
        label="駅名"
        variant="standard"
        value={inputName}
        sx={{ maxWidth: "50%" }}
        onChange={handleChangeText}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />
      <CustomPagination />

      <TableContainer component={Paper}>
        <Table aria-label="collapsible table" size="medium">
          <TableHead>
            {isAuthenticated ? (
              <TableRow>
                <TableCell sx={{ paddingLeft: 1.5, paddingRight: 0.5 }}>
                  駅名
                </TableCell>
                <TableCell sx={{ minWidth: 75, paddingX: 0.5 }}>
                  都道府県
                </TableCell>
                <TableCell align="center" sx={{ minWidth: 75, paddingX: 0.5 }}>
                  立ち寄り
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ paddingLeft: 0, paddingRight: 1.5 }}
                >
                  詳細
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell sx={{ width: "70%" }}>駅名</TableCell>
                <TableCell sx={{ width: "30%" }}>都道府県</TableCell>
              </TableRow>
            )}
          </TableHead>
          <TableBody>
            {stationGroupsInfo.map((item, idx) => (
              <Row
                info={item}
                latestDate={
                  latestHistoryList ? latestHistoryList[idx] : undefined
                }
                key={item.stationGroupCode}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CustomPagination />
    </Container>
  );
};

export default StationList;
