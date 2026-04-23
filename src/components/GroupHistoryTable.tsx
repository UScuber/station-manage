import { useEffect, useState } from "react";
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
import { RECORD_STATE_LABELS_WITH_GROUP } from "../constants";
import { ConfirmDialog } from "../components";
import { formatDateTimeFull } from "../utils/formatDate";

const GroupHistoryTable = ({
  stationGroupCode,
}: {
  stationGroupCode: number;
}) => {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteHistoryItem, setDeleteHistoryItem] =
    useState<StationHistoryData>();

  const stationGroupAllHistoryQuery =
    useStationGroupAllHistory(stationGroupCode);
  const stationGroupAllHistory = stationGroupAllHistoryQuery.data;

  useEffect(() => {
    if (stationGroupAllHistoryQuery.data) {
      setDeleteLoading(false);
    }
  }, [stationGroupAllHistoryQuery.data]);

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
    if (value) handleDeleteHistory(value);
  };

  const handleClickDeleteButton = (value: StationHistoryData) => {
    setDialogOpen(true);
    setDeleteHistoryItem(value);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ fontSize: 18 }}>
        履歴 {stationGroupAllHistory?.length ?? ""}件
      </Typography>
      <Box sx={{ margin: 1 }}>
        <Typography variant="h6" component="div">
          History
        </Typography>

        {stationGroupAllHistoryQuery.isError && (
          <Typography variant="h6">
            Error: {stationGroupAllHistoryQuery.error.message}
          </Typography>
        )}
        {!stationGroupAllHistoryQuery.isError && !stationGroupAllHistory && (
          <CircularProgress size={25} />
        )}

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
              {stationGroupAllHistory.map((history) => (
                <TableRow key={`${history.date}|${history.state}`}>
                  <TableCell>{formatDateTimeFull(history.date)}</TableCell>
                  <TableCell>
                    {RECORD_STATE_LABELS_WITH_GROUP[history.state] ??
                      history.state}
                  </TableCell>
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
        descriptionFn={(value) =>
          `${formatDateTimeFull(value.date)}  ${value.railwayName ?? ""}  ${
            RECORD_STATE_LABELS_WITH_GROUP[value.state] ?? value.state
          }`
        }
      />
    </Box>
  );
};

export default GroupHistoryTable;
