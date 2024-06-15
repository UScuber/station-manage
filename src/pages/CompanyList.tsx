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
import { Company, StationProgress, useCompanyList, useCompanyProgressList } from "../api/Api";
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
    info: Company,
    progress: StationProgress | undefined,
  }
) => {
  if(!progress){
    return (
      <TableRow>
        <TableCell>
          <CustomLink to={"/company/" + info.companyCode}>
            <Typography variant="h6" sx={{ fontSize: 14 }}>{info.companyName}</Typography>
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
        <CustomLink to={"/company/" + info.companyCode}>
          <Typography variant="h6" sx={{ fontSize: 14 }}>{info.companyName}</Typography>
        </CustomLink>
      </TableCell>
      <TableCell>
        <CircleProgress size={25} progress={progress} />
      </TableCell>
    </TableRow>
  );
};

const CompanyList = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [inputName, setInputName] = useState("");

  const companyListQuery = useCompanyList();
  const companyList = companyListQuery.data;
  const companyProgressListQuery = useCompanyProgressList();
  const companyProgressList = companyProgressListQuery.data;


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

  if(companyListQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(!companyList){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  const filteredCompanies =
    companyList
      .map((comp, idx) => ({
        ...comp,
        ord: nameSimilarity(comp.companyName, inputName),
        idx: idx,
      }))
      .filter(comp => comp.ord < 4)
      .sort((a, b) => a.ord - b.ord);
  const dividedCompanies = filteredCompanies.slice((page-1)*rowsPerPage, page*rowsPerPage);

  const CustomPagination = (): JSX.Element => (
    <BinaryPagination
      page={page}
      count={filteredCompanies.length}
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
        id="company name"
        label="company name"
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
        <Table aria-label="company table">
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {dividedCompanies.map(item => (
              <Row
                info={item}
                progress={companyProgressList ? companyProgressList[item.idx] : undefined}
                key={item.companyCode}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <CustomPagination />
    </Container>
  );
};

export default CompanyList;
