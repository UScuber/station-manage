import { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Button, CircularProgress, Divider, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { Add, Cancel, Delete, Directions, Edit, OpenInNew, Save } from "@mui/icons-material";
import { Station, useTimetableURL, useUpdateTimetableURLMutation, useUpdateTrainPosURLMutation } from "../api";
import { useAuth } from "../auth";
import ConfirmDialog from "./ConfirmDialog";


const EditableText = (
  { text, onChangeText }
  :{
    text: string,
    onChangeText: (text: string) => unknown,
  }
) => {
  const [editing, setEditting] = useState(false);
  const [newText, setNewText] = useState(text);
  
  const handleSaveClick = () => {
    onChangeText(newText);
    setEditting(false);
  };
  const handleCancelClick = () => {
    setNewText(text);
    setEditting(false);
  };

  return (
    <Box sx={{ color: "gray" }}>
      {editing ? (
        <Box sx={{ display: "flex" }}>
          <TextField
            variant="outlined"
            value={newText}
            size="small"
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveClick()}
            inputProps={{ style: { fontSize: 14 } }}
            inputRef={input => input && input.focus()}
            sx={{ width: "100%" }}
          />
          <Button
            size="small"
            onClick={handleSaveClick}
            sx={{ fontSize: 12, padding: 0.5, minWidth: "auto" }}
          >
            Save
          </Button>
          <Button
            size="small"
            onClick={handleCancelClick}
            sx={{ fontSize: 12, padding: 0.5, minWidth: "auto" }}
          >
            Cancel
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="h6" sx={{ fontSize: 14, display: "inline-block" }}>
            {text ? text : "列車走行位置のURLを登録する"}
          </Typography>
          <IconButton
            aria-label="edit"
            size="small"
            onClick={() => setEditting(true)}
            sx={{ color: "gray" }}
          >
            <Edit />
          </IconButton>
        </Box>
      )}
    </Box>
  )
};


type Column = {
  direction: string,
  url: string,
};

const EditableTable = (
  { table, onChangeOrAddRow, onDeleteRow }
  :{
    table: Column[],
    onChangeOrAddRow: (row: Column) => unknown,
    onDeleteRow: (row: Column) => unknown,
  }
) => {
  const [rowDirection, setRowDirection] = useState<string | null>(null);
  const [editURL, setEditURL] = useState("");
  const [addingDirection, setAddingDirection] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Column>();

  const handleEditClick = (row: Column) => {
    setRowDirection(row.direction);
    setEditURL(row.url);
    setAddingDirection("");
  };

  const handleSaveClick = () => {
    const row = table.find(row => row.direction === rowDirection);
    if(!row) return;
    onChangeOrAddRow(row);
    setRowDirection(null);
    setEditURL("");
  };

  const handleCancelClick = () => {
    setRowDirection(null);
    setEditURL("");
  };

  const handleDeleteClick = (direction: string) => {
    const row = table.find(row => row.direction === direction);
    if(!row) return;
    setDialogOpen(true);
    setDeleteRow(row);
  };

  const handleDialogClose = (value: Column | undefined) => {
    setDialogOpen(false);
    if(value) onDeleteRow(value);
    setDeleteRow(undefined);
  };

  const handleAddClick = () => {
    if(!addingDirection || !editURL) return;
    onChangeOrAddRow({ direction: addingDirection.trim(), url: editURL.trim() });
    setEditURL("");
    setAddingDirection("");
  };


  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: "30%" }}>方面/方向</TableCell>
            <TableCell sx={{ width: "50%" }}>URL</TableCell>
            <TableCell sx={{ width: "15%" }} />
          </TableRow>
        </TableHead>
        <TableBody>
          {table.map(row => (
            <TableRow key={row.direction}>
              <TableCell>{row.direction}</TableCell>
              <TableCell>
                {rowDirection === row.direction ? (
                  <TextField
                    size="small"
                    value={editURL}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveClick()}
                    inputProps={{ style: { fontSize: 14 } }}
                    onChange={(e) => setEditURL(e.target.value)}
                    placeholder="時刻表のURL"
                    fullWidth
                  />
                ) : (
                  row.url
                )}
              </TableCell>
              <TableCell>
                {rowDirection === row.direction ? (
                  <>
                    <IconButton onClick={handleSaveClick}>
                      <Save />
                    </IconButton>
                    <IconButton onClick={handleCancelClick}>
                      <Cancel />
                    </IconButton>
                  </>
                ) : (
                  <>
                    <IconButton onClick={() => handleEditClick(row)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteClick(row.direction)}>
                      <Delete />
                    </IconButton>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell>
              <TextField
                size="small"
                value={addingDirection}
                onKeyDown={(e) => e.key === "Enter" && handleAddClick()}
                inputProps={{ style: { fontSize: 14 } }}
                onChange={(e) => setAddingDirection(e.target.value)}
                onFocus={handleCancelClick}
                placeholder="～方面/～方向"
                fullWidth
              />
            </TableCell>
            <TableCell>
              <TextField
                size="small"
                value={addingDirection ? editURL : ""}
                onKeyDown={(e) => e.key === "Enter" && handleAddClick()}
                inputProps={{ style: { fontSize: 14 } }}
                onChange={(e) => setEditURL(e.target.value)}
                placeholder="時刻表のURL(先に方面を入力)"
                disabled={!addingDirection}
                fullWidth
              />
            </TableCell>
            <TableCell>
              <IconButton color="primary" onClick={handleAddClick}>
                <Add />
              </IconButton>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <ConfirmDialog
        open={dialogOpen}
        selectedValue={deleteRow}
        onClose={handleDialogClose}
        title="時刻表URLを削除しますか？"
        descriptionFn={value => `${value.direction}： ${value.url}`}
      />
    </TableContainer>
  );
};


// 時刻表のリンクを表示
const TimetableURL = ({ info, visible }: { info: Station, visible: boolean }) => {
  const { isAdmin } = useAuth();

  const timetableQuery = useTimetableURL(visible ? info.stationCode : undefined);
  const timetable = timetableQuery.data;

  const updateURLMutation = useUpdateTimetableURLMutation();
  const updateTrainPosMutation = useUpdateTrainPosURLMutation();

  const handleUpdateTimetable = (row: Column) => {
    updateURLMutation.mutate({
      stationCode: info.stationCode,
      direction: row.direction,
      mode: "update",
      url: row.url,
    });
  };

  const handleDeleteTimetable = (row: Column) => {
    updateURLMutation.mutate({
      stationCode: info.stationCode,
      direction: row.direction,
      mode: "delete",
      url: row.url,
    });
  };

  const handleUpdateTrainPos = (text: string) => {
    updateTrainPosMutation.mutate({
      stationCode: info.stationCode,
      url: text,
    });
  };

  if(!timetable){
    return (
      <Box>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ fontSize: 18 }}>時刻表</Typography>
        {timetable.timetable.sort().map(row => (
          <Button
            component={Link}
            target="__blank"
            to={row.url}
            endIcon={<OpenInNew />}
            key={row.direction}
            sx={{ mr: 1, ml: 1 }}
          >
            {row.direction}
          </Button>
        ))}

        {isAdmin && <EditableTable
            table={timetable.timetable.sort()}
            onChangeOrAddRow={(row) => handleUpdateTimetable(row)}
            onDeleteRow={(row) => handleDeleteTimetable(row)}
          />}
      </Box>
      <Box>
        {timetable.trainPos &&
          <Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="h6" sx={{ fontSize: 18 }}>列車走行位置</Typography>
            <Button
              component={Link}
              target="__blank"
              to={timetable.trainPos}
              endIcon={<OpenInNew />}
              sx={{ mr: 1, ml: 1 }}
            >
              列車走行位置
            </Button>
          </Box>}
        {isAdmin && <EditableText text={timetable.trainPos ?? ""} onChangeText={handleUpdateTrainPos} />}
      </Box>
    </Box>
  );
};

export default TimetableURL;
