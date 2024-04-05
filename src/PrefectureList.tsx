import {
  Box,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { usePrefList, usePrefProgress } from "./Api";
import { CustomLink } from "./components";

const PrefProgress = ({ code }: { code: number }) => {
  const prefProgressQuery = usePrefProgress(code);
  const prefProgress = prefProgressQuery.data;

  if(!prefProgress){
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
        value={prefProgress.getOrPassStationNum / prefProgress.stationNum * 100}
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
        {`${prefProgress.getOrPassStationNum}/${prefProgress.stationNum}`}
      </Typography>
    </Box>
  );
};

const PrefectureList = () => {
  const prefListQuery = usePrefList();
  const prefList = prefListQuery.data;

  if(prefListQuery.isError){
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if(!prefList){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <TableContainer component={Paper}>
        <Table aria-label="prefecture table">
          <TableHead>
            <TableRow>
              <TableCell>Prefecture</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {prefList.map(item => (
              <TableRow key={item.prefCode}>
                <TableCell>
                  <CustomLink to={"/pref/" + item.prefCode}>
                    <Typography variant="h6" sx={{ fontSize: 14 }}>{item.prefName}</Typography>
                  </CustomLink>
                </TableCell>
                <TableCell><PrefProgress code={item.prefCode} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default PrefectureList;
