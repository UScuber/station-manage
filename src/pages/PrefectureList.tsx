import {
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
import { Prefecture, usePrefList, usePrefProgress } from "../api/Api";
import { CircleProgress, CustomLink } from "../components";
import { useAuth } from "../auth/auth";

const Row = ({ info }: { info: Prefecture }) => {
  const { isAuthenticated } = useAuth();
  const prefProgressQuery = usePrefProgress(isAuthenticated ? info.prefCode : undefined);
  const prefProgress = prefProgressQuery.data;

  if(!isAuthenticated || !prefProgress){
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
        <CircleProgress size={25} progress={prefProgress} />
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
