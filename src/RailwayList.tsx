import { useState } from "react";
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
import { Search as SearchIcon } from "@mui/icons-material";
import { useRailwayList, useRailwayProgress } from "./Api";
import { BinaryPagination, CustomLink } from "./components";

// 文字列同士の類似度、価が小さいほど高い
const nameSimilarity = (name: string, input: string) => {
  if(name === input) return 0;
  const pos = name.indexOf(input);
  if(pos === -1) return 4;
  if(pos === 0) return 1;
  if(pos === name.length - input.length) return 2;
  return 3;
};

const RailwayProgress = ({ code }: { code: number }) => {
  const railwayProgressQuery = useRailwayProgress(code);
  const railwayProgress = railwayProgressQuery.data;

  if(!railwayProgress){
    return (
      <></>
    );
  }

  return (
    <Box sx={{ position: "relative", display: "flex", height: 25, alignItems: "center" }}>
      <CircularProgress
        variant="determinate"
        sx={{
          color: (theme) =>
            theme.palette.grey[theme.palette.mode === "light" ? 200 : 800],
        }}
        size={25}
        thickness={6}
        value={100}
      />
      <CircularProgress
        variant="determinate"
        size={25}
        thickness={6}
        value={railwayProgress.getOrPassStationNum / railwayProgress.stationNum * 100}
        sx={{ position: "absolute", left: 0 }}
      />
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{
          fontSize: 12,
          ml: 1,
          width: 48,
          height: 20,
          display: "inline-block",
        }}
      >
        {`${railwayProgress.getOrPassStationNum}/${railwayProgress.stationNum}`}
      </Typography>
    </Box>
  );
};

const RailwayList = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [inputName, setInputName] = useState("");

  const railwayListQuery = useRailwayList();
  const railwayList = railwayListQuery.data;

  const handleChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputName(event.target.value);
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: SelectChangeEvent) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const filteredRailways =
    railwayList
      ?.map(rail => ({ ...rail, ord: nameSimilarity(rail.railwayName, inputName) }))
      .filter(rail => rail.ord < 4)
      .sort((a, b) => a.ord - b.ord);
  const dividedRailways = filteredRailways?.slice((page-1)*rowsPerPage, page*rowsPerPage);

  if(railwayListQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(railwayListQuery.isLoading){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  const CustomPagination = (): JSX.Element => (
    <BinaryPagination
      page={page}
      count={filteredRailways!.length}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={[10,25,50,100,200]}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      sx={{ my: 1 }}
    />
  );

  return (
    <Container>
      <TextField
        id="railway name"
        label="railway name"
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
        <Table aria-label="railway table">
          <TableHead>
            <TableRow>
              <TableCell>Railway</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {dividedRailways?.map(item => (
              <TableRow key={item.railwayCode}>
                <TableCell>
                  <CustomLink to={"/railway/" + item.railwayCode}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontSize: 14,
                        textDecoration: "underline",
                        textDecorationColor: "#" + item.railwayColor,
                        textDecorationThickness: 2,
                      }}
                    >{item.railwayName}</Typography>
                  </CustomLink>
                </TableCell>
                <TableCell><RailwayProgress code={item.railwayCode} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CustomPagination />
    </Container>
  );
};

export default RailwayList;
