import { useState } from "react";
import {
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import {
  StationHistoryData,
  useDeleteStationHistoryMutation,
  useStationAllHistory,
} from "../api";
import { ConfirmDialog } from "../components";
import getDateString from "../utils/getDateString";


const stateName = ["乗降", "通過"];


// 履歴のテーブル(StationInfo.tsxで使用)
const HistoryListTable = ({ stationCode, visible }: { stationCode: number, visible: boolean }) => {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteHistoryItem, setDeleteHistoryItem] = useState<StationHistoryData>();
  const stationHistoryQuery = useStationAllHistory(visible ? stationCode : undefined, () => {
    setDeleteLoading(false);
  });
  const stationHistory = stationHistoryQuery.data;

  const deleteStationHistoryMutation = useDeleteStationHistoryMutation();

  const handleDeleteHistory = (history: StationHistoryData) => {
    deleteStationHistoryMutation.mutate({
      stationCode: history.stationCode!,
      stationGroupCode: history.stationGroupCode,
      date: history.date,
      state: history.state,
    });
    setDeleteLoading(true);
  };

  const handleDialogClose = (value: StationHistoryData | undefined) => {
    setDialogOpen(false);
    if(value) handleDeleteHistory(value);
  };

  const handleClickDeleteButton = (value: StationHistoryData) => {
    setDialogOpen(true);
    setDeleteHistoryItem(value);
  };


  return (
    <Box>
      {<Typography variant="h6" sx={{ fontSize: 18 }}>履歴 {stationHistory?.length ?? ""}件</Typography>}

      <Box sx={{ margin: 1 }}>
        {stationHistoryQuery.isError && <Typography variant="h6">Error</Typography>}
        {!stationHistoryQuery.isError && !stationHistory && <CircularProgress size={25} />}

        {stationHistory && (
          <Table size="small" aria-label="dates">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>State</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {stationHistory.map(history => (
                <TableRow key={`${history.date}|${history.state}`}>
                  <TableCell>{getDateString(history.date)}</TableCell>
                  <TableCell>{stateName[history.state]}</TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="delete"
                      size="small"
                      onClick={() => handleClickDeleteButton(history)}
                      disabled={deleteLoading}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
      <ConfirmDialog
        open={dialogOpen}
        selectedValue={deleteHistoryItem}
        onClose={handleDialogClose}
        title="データを削除しますか"
        descriptionFn={value => `${getDateString(value.date)}  ${stateName[value.state]}`}
      />
    </Box>
  );
};

export default HistoryListTable;
