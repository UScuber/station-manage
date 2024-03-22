import { useState } from "react";
import {
  Box,
  CircularProgress,
  Container,
  InputAdornment,
  Paper,
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
import { useCompanyList, useCompanyProgress } from "./Api";
import { CustomLink } from "./components";

// 文字列同士の類似度、価が小さいほど高い
const nameSimilarity = (name: string, input: string) => {
  if(name === input) return 0;
  const pos = name.indexOf(input);
  if(pos === -1) return 4;
  if(pos === 0) return 1;
  if(pos === name.length - input.length) return 2;
  return 3;
};

const CompanyProgress = ({ code }: { code: number }) => {
  const companyProgressQuery = useCompanyProgress(code);
  const companyProgress = companyProgressQuery.data;

  if(!companyProgress){
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
        value={companyProgress.getOrPassStationNum / companyProgress.stationNum * 100}
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
        {`${companyProgress.getOrPassStationNum}/${companyProgress.stationNum}`}
      </Typography>
    </Box>
  );
};

const CompanyList = () => {
  const [inputName, setInputName] = useState("");

  const companyListQuery = useCompanyList();
  const companyList = companyListQuery.data;

  const handleChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputName(event.target.value);
  };

  const filteredCompanies =
    companyList
      ?.map(comp => ({ ...comp, ord: nameSimilarity(comp.companyName, inputName) }))
      .filter(comp => comp.ord < 4)
      .sort((a, b) => a.ord - b.ord);

  if(companyListQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(companyListQuery.isLoading){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

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
      <TableContainer component={Paper}>
        <Table aria-label="company table">
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCompanies?.map(item => (
              <TableRow key={item.companyCode}>
                <TableCell>
                  <CustomLink to={"/company/" + item.companyCode}>
                    <Typography variant="h6" sx={{ fontSize: 14 }}>{item.companyName}</Typography>
                  </CustomLink>
                </TableCell>
                <TableCell><CompanyProgress code={item.companyCode} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default CompanyList;
