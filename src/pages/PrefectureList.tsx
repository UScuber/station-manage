import {
  CircularProgress,
  Container,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Prefecture,
  StationProgress,
  usePrefList,
  usePrefProgressList,
} from "../api";
import {
  CircleProgress,
  CustomLink,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "../components";

const Row = ({
  info,
  progress,
}: {
  info: Prefecture;
  progress: StationProgress | undefined;
}) => {
  const theme = useTheme();

  if (!progress) {
    return (
      <TableRow>
        <TableCell>
          <CustomLink to={"/pref/" + info.prefCode}>
            <Typography variant="h6" sx={{ fontSize: 14 }}>
              {info.prefName}
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
        <CustomLink to={"/pref/" + info.prefCode}>
          <Typography variant="h6" sx={{ fontSize: 14 }}>
            {info.prefName}
          </Typography>
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

  if (prefListQuery.isError) {
    return (
      <Container>
        <Typography variant="h5">Error</Typography>
      </Container>
    );
  }

  if (!prefList) {
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Table aria-label="prefecture table">
        <TableHead>
          <TableRow>
            <TableCell>都道府県</TableCell>
            <TableCell />
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
    </Container>
  );
};

export default PrefectureList;
