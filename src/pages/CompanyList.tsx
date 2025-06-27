import { useState } from "react";
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
  Company,
  StationProgress,
  useCompanyList,
  useCompanyProgressList,
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
  info: Company;
  progress: StationProgress | undefined;
}) => {
  const theme = useTheme();

  if (!progress) {
    return (
      <TableRow>
        <TableCell>
          <CustomLink to={"/company/" + info.companyCode}>
            <Typography variant="h6" sx={{ fontSize: 14 }}>
              {info.companyName}
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
            : theme.palette.complete.light
        } ${achieve_rate}%, transparent ${achieve_rate}%)`,
      }}
    >
      {/* <HalfTableCell
        achieve_rate={achieve_rate}
        direction="left"
        widthPercent={70}
      >
        <CustomLink to={"/company/" + info.companyCode}>
          <Typography variant="h6" sx={{ fontSize: 14 }}>
            {info.companyName}
          </Typography>
        </CustomLink>
      </HalfTableCell>
      <HalfTableCell
        achieve_rate={achieve_rate}
        direction="right"
        widthPercent={30}
      >
        <CircleProgress size={25} progress={progress} />
      </HalfTableCell> */}
      <TableCell>
        <CustomLink to={"/company/" + info.companyCode}>
          <Typography variant="h6" sx={{ fontSize: 14 }}>
            {info.companyName}
          </Typography>
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

  if (companyListQuery.isError) {
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if (!companyList) {
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  const filteredCompanies = companyList
    .map((comp, idx) => ({
      ...comp,
      ord: nameSimilarity(comp.companyName, inputName),
      idx: idx,
    }))
    .filter((comp) => comp.ord < 4)
    .sort((a, b) => a.ord - b.ord);
  const dividedCompanies = filteredCompanies.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const CustomPagination = (): JSX.Element => (
    <BinaryPagination
      page={page}
      count={filteredCompanies.length}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={[10, 25, 50, 100, 200]}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      sx={{ my: 1 }}
    />
  );

  return (
    <Container>
      <TextField
        id="company name"
        label="会社名"
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
      <Table aria-label="company table">
        <TableHead>
          <TableRow sx={{ fontSize: 14 }}>
            <TableCell>会社名</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {dividedCompanies.map((item) => (
            <Row
              info={item}
              progress={
                companyProgressList ? companyProgressList[item.idx] : undefined
              }
              key={item.companyCode}
            />
          ))}
        </TableBody>
      </Table>

      <CustomPagination />
    </Container>
  );
};

export default CompanyList;
