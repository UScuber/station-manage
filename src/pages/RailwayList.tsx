import { useState } from "react";
import {
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
import { Railway, StationProgress, useRailwayList, useRailwayProgress, useRailwayProgressList } from "../api/Api";
import { useAuth } from "../auth/auth";
import { BinaryPagination, CircleProgress, CustomLink } from "../components";


// 文字列同士の類似度、価が小さいほど高い
const nameSimilarity = (name: string, input: string) => {
  if(name === input) return 0;
  const pos = name.indexOf(input);
  if(pos === -1) return 4;
  if(pos === 0) return 1;
  if(pos === name.length - input.length) return 2;
  return 3;
};


const Row = (
  { info, progress }
  :{
    info: Railway,
    progress: StationProgress | undefined,
  }
) => {
  if(!progress){
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
            >{info.railwayName}</Typography>
          </CustomLink>
        </TableCell>
        <TableCell />
      </TableRow>
    );
  }

  return (
    <TableRow sx={{
      bgcolor: (progress.getOrPassStationNum === progress.stationNum ? "access.main" : "none")
    }}>
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
          >{info.railwayName}</Typography>
        </CustomLink>
      </TableCell>
      <TableCell>
        <CircleProgress size={25} progress={progress} />
      </TableCell>
    </TableRow>
  );
};

const RailwayList = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [inputName, setInputName] = useState("");

  const railwayListQuery = useRailwayList();
  const railwayList = railwayListQuery.data;
  const railwayProgressListQuery = useRailwayProgressList();
  const railwayProgressList = railwayProgressListQuery.data;

  const handleChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputName(event.target.value);
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event: SelectChangeEvent) => {
    setRowsPerPage(+event.target.value);
    setPage(1);
  };

  if(railwayListQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(!railwayList){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  const filteredRailways =
    railwayList
      .map((rail, idx) => ({
        ...rail,
        ord: nameSimilarity(rail.railwayName, inputName),
        idx: idx,
      }))
      .filter(rail => rail.ord < 4)
      .sort((a, b) => a.ord - b.ord);
  const dividedRailways = filteredRailways.slice((page-1)*rowsPerPage, page*rowsPerPage);

  const CustomPagination = (): JSX.Element => (
    <BinaryPagination
      page={page}
      count={filteredRailways.length}
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
            {dividedRailways.map(item => (
              <Row
                info={item}
                progress={railwayProgressList ? railwayProgressList[item.idx] : undefined}
                key={item.railwayCode}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CustomPagination />
    </Container>
  );
};

export default RailwayList;
