import { useState } from "react";
import {
  Box,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import {
  StationHistoryData,
  useDeleteStationHistoryMutation,
  useStationGroupAllHistory,
} from "../api";
import { Collapser, ConfirmDialog } from "../components";
import getDateString from "../utils/getDateString";


const stateName = ["乗降", "通過", "立ち寄り"];


const GroupHistoryTable = ({ stationGroupCode, visible }: { stationGroupCode: number, visible: boolean }) => {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteHistoryItem, setDeleteHistoryItem] = useState<StationHistoryData>();
  
  const stationGroupAllHistoryQuery = useStationGroupAllHistory(visible ? stationGroupCode : undefined,
    (data: StationHistoryData[]) => {
      setDeleteLoading(false);
    }
  );
  const stationGroupAllHistory = stationGroupAllHistoryQuery.data;

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
      <Typography variant="h6" sx={{ fontSize: 18 }}>履歴 {stationGroupAllHistory?.length ?? ""}件</Typography>
      <Box sx={{ margin: 1 }}>
        <Typography variant="h6" component="div">History</Typography>

        {stationGroupAllHistoryQuery.isError && <Typography variant="h6">Error</Typography>}
        {!stationGroupAllHistoryQuery.isError && !stationGroupAllHistory && <CircularProgress size={25} />}

        {stationGroupAllHistory && (
          <Table size="small" aria-label="dates">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>State</TableCell>
                <TableCell>Railway</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {stationGroupAllHistory.map(history => (
                <TableRow key={`${history.date}|${history.state}`}>
                  <TableCell>{getDateString(history.date)}</TableCell>
                  <TableCell>{stateName[history.state]}</TableCell>
                  <TableCell
                    sx={{
                      textDecoration: "underline",
                      textDecorationColor: "#" + history?.railwayColor,
                      textDecorationThickness: 2,
                    }}
                  >
                    {history.railwayName ?? ""}
                  </TableCell>
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
        descriptionFn={value => `${getDateString(value.date)}  ${value.railwayName ?? ""}  ${stateName[value.state]}`}
      />
    </Box>
  );
};

export default GroupHistoryTable;
