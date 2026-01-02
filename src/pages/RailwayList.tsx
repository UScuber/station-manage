import { useEffect, useState } from "react";
import {
  CircularProgress,
  Container,
  InputAdornment,
  SelectChangeEvent,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import {
  Railway,
  StationProgress,
  useRailwayList,
  useRailwayProgressList,
} from "../api";
import {
  BinaryPagination,
  CircleProgress,
  CustomLink,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "../components";
import { useLocation, useNavigate } from "react-router-dom";
import getURLSearchParams from "../utils/getURLSearchParams";

// 文字列同士の類似度、価が小さいほど高い
const nameSimilarity = (name: string, input: string) => {
  if (name === input) return 0;
  const pos = name.indexOf(input);
  if (pos === -1) return 4;
  if (pos === 0) return 1;
  if (pos === name.length - input.length) return 2;
  return 3;
};

const Row = ({
  info,
  progress,
}: {
  info: Railway;
  progress: StationProgress | undefined;
}) => {
  const theme = useTheme();

  if (!progress) {
    return (
      <TableRow>
        <TableCell>
          <CustomLink to={"/railway/" + info.railwayCode}>
            <Typography
              variant="h6"
              sx={{
                fontSize: 14,
                textDecoration: "underline",
                textDecorationColor: "#" + info.railwayColor,
                textDecorationThickness: 2,
              }}
            >
              {info.railwayName}
            </Typography>
          </CustomLink>
        </TableCell>
        <TableCell />
      </TableRow>
    );
  }

  const achieve_rate =
    (progress.getOrPassStationNum / progress.stationNum) * 100;

  return (
    <TableRow
      sx={{
        background: `linear-gradient(to right, ${
          achieve_rate !== 100
            ? theme.palette.access.main
            : theme.palette.complete.main
        } ${achieve_rate}%, transparent ${achieve_rate}%)`,
      }}
    >
      <TableCell>
        <CustomLink to={"/railway/" + info.railwayCode}>
          <Typography
            variant="h6"
            sx={{
              fontSize: 14,
              textDecoration: "underline",
              textDecorationColor: "#" + info.railwayColor,
              textDecorationThickness: 2,
            }}
          >
            {info.railwayName}
          </Typography>
        </CustomLink>
      </TableCell>
      <TableCell>
        <CircleProgress size={25} progress={progress} />
      </TableCell>
    </TableRow>
  );
};

const RailwayList = () => {
  const location = useLocation();
  const navigation = useNavigate();
  const params = new URLSearchParams(location.search);

  // 検索で用いるデータ
  const [searchParams, setSearchParams] = useState({
    name: params.get("name") ?? "",
    page: +(params.get("page") ?? 1),
    pagesize: +(params.get("rowsPerPage") ?? 10),
  });

  const railwayListQuery = useRailwayList();
  const railwayList = railwayListQuery.data;
  const railwayProgressListQuery = useRailwayProgressList();
  const railwayProgressList = railwayProgressListQuery.data;

  const handleChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams({
      ...searchParams,
      name: event.target.value,
    });
  };

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

  useEffect(() => {
    navigation(`?${getURLSearchParams(searchParams).toString()}`, {
      replace: true,
    });
  }, [searchParams]);

  if (railwayListQuery.isError) {
    return (
      <Container>
        <Typography variant="h5">
          Error: {railwayListQuery.error.message}
        </Typography>
      </Container>
    );
  }

  if (!railwayList) {
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  const filteredRailways = railwayList
    .map((rail, idx) => ({
      ...rail,
      ord: nameSimilarity(rail.railwayName, searchParams.name),
      idx: idx,
    }))
    .filter((rail) => rail.ord < 4)
    .sort((a, b) => a.ord - b.ord);
  const dividedRailways = filteredRailways.slice(
    (searchParams.page - 1) * searchParams.pagesize,
    searchParams.page * searchParams.pagesize
  );

  const CustomPagination = (): React.ReactElement => (
    <BinaryPagination
      page={searchParams.page}
      count={filteredRailways.length}
      rowsPerPage={searchParams.pagesize}
      rowsPerPageOptions={[10, 25, 50, 100, 200]}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      sx={{ my: 1 }}
    />
  );

  return (
    <Container>
      <TextField
        id="railway name"
        label="路線名"
        variant="standard"
        value={searchParams.name}
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

      <Table aria-label="railway table">
        <TableHead>
          <TableRow>
            <TableCell>路線名</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {dividedRailways.map((item) => (
            <Row
              info={item}
              progress={
                railwayProgressList ? railwayProgressList[item.idx] : undefined
              }
              key={item.railwayCode}
            />
          ))}
        </TableBody>
      </Table>

      <CustomPagination />
    </Container>
  );
};

export default RailwayList;
