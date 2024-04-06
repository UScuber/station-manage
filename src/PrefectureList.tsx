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
import { Prefecture, usePrefList, usePrefProgress } from "./Api";
import { CustomLink } from "./components";

const Row = ({ info }: { info: Prefecture }) => {
  const prefProgressQuery = usePrefProgress(info.prefCode);
  const prefProgress = prefProgressQuery.data;

  if(!prefProgress){
    return (
      <TableRow>
        <TableCell>
          <CustomLink to={"/pref/" + info.prefCode}>
            <Typography variant="h6" sx={{ fontSize: 14 }}>{info.prefName}</Typography>
          </CustomLink>
        </TableCell>
        <TableCell />
      </TableRow>
    );
  }

  return (
    <TableRow sx={{
      bgcolor: (prefProgress.getOrPassStationNum === prefProgress.stationNum ? "access.main" : "none")
    }}>
      <TableCell>
        <CustomLink to={"/pref/" + info.prefCode}>
          <Typography variant="h6" sx={{ fontSize: 14 }}>{info.prefName}</Typography>
        </CustomLink>
      </TableCell>
      <TableCell>
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
      </TableCell>
    </TableRow>
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
              <Row info={item} key={item.prefCode} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default PrefectureList;
