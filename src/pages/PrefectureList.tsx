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
  useTheme,
} from "@mui/material";
import {
  Prefecture,
  StationProgress,
  usePrefList,
  usePrefProgressList,
} from "../api";
import { CircleProgress, CustomLink } from "../components";


const Row = (
  { info, progress }
  :{
    info: Prefecture,
    progress: StationProgress | undefined,
  }
) => {
  const theme = useTheme();

  if(!progress){
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

  const achieve_rate = progress.getOrPassStationNum / progress.stationNum * 100;

  return (
    <TableRow sx={{
      background: `linear-gradient(to right, ${theme.palette.access.main} ${achieve_rate}%, transparent ${achieve_rate}%)`
    }}>
      <TableCell>
        <CustomLink to={"/pref/" + info.prefCode}>
          <Typography variant="h6" sx={{ fontSize: 14 }}>{info.prefName}</Typography>
        </CustomLink>
      </TableCell>
      <TableCell>
        <CircleProgress size={25} progress={progress} />
      </TableCell>
    </TableRow>
  );
};

const PrefectureList = () => {
  const prefListQuery = usePrefList();
  const prefList = prefListQuery.data;

  const progressListQuery = usePrefProgressList();
  const progressList = progressListQuery.data;


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
            {prefList.map((item, idx) => (
              <Row
                info={item}
                progress={progressList ? progressList[idx] : undefined}
                key={item.prefCode}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default PrefectureList;
