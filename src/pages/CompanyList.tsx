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
  const location = useLocation();
  const navigation = useNavigate();
  const params = new URLSearchParams(location.search);

  // 検索で用いるデータ
  const [searchParams, setSearchParams] = useState({
    name: params.get("name") ?? "",
    page: +(params.get("page") ?? 1),
    pagesize: +(params.get("pagesize") ?? 10),
  });

  const companyListQuery = useCompanyList();
  const companyList = companyListQuery.data;
  const companyProgressListQuery = useCompanyProgressList();
  const companyProgressList = companyProgressListQuery.data;

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

  if (companyListQuery.isError) {
    return (
      <Container>
        <Typography variant="h5">
          Error: {companyListQuery.error.message}
        </Typography>
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
      ord: nameSimilarity(comp.companyName, searchParams.name),
      idx: idx,
    }))
    .filter((comp) => comp.ord < 4)
    .sort((a, b) => a.ord - b.ord);
  const dividedCompanies = filteredCompanies.slice(
    (searchParams.page - 1) * searchParams.pagesize,
    searchParams.page * searchParams.pagesize
  );

  const CustomPagination = (): JSX.Element => (
    <BinaryPagination
      page={searchParams.page}
      count={filteredCompanies.length}
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
        id="company name"
        label="会社名"
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
