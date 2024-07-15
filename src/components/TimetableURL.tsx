import { useState } from "react";
import { Link } from "react-router-dom";
import { Box, Button, IconButton, TextField, Typography } from "@mui/material";
import { Edit, OpenInNew } from "@mui/icons-material";
import { Station, useUpdateTimetableURLMutation } from "../api";
import Collapser from "./Collapser";
import { useAuth } from "../auth";


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
            {text ? text : "未登録"}
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


// 時刻表のリンクを表示
const TimetableURL = ({ info }: { info: Station }) => {
  const { isAdmin } = useAuth();

  const updateURLMutation = useUpdateTimetableURLMutation();

  const handleUpdateTimetable = (text: string) => {
    updateURLMutation.mutate({
      stationCode: info.stationCode,
      type: "timetable",
      url: text,
    });
  };

  const handleUpdateTrainPos = (text: string) => {
    updateURLMutation.mutate({
      stationCode: info.stationCode,
      type: "trainPos",
      url: text,
    })
  };

  return (
    <Collapser
      buttonText={<Typography variant="h6">リンク</Typography>}
    >
      <Box>
        <Button
          component={Link}
          target="__blank"
          to={info.timetableURL ?? ""}
          endIcon={<OpenInNew />}
          disabled={!info.timetableURL}
        >
          時刻表
        </Button>
        {isAdmin && <EditableText text={info.timetableURL ?? ""} onChangeText={handleUpdateTimetable} />}
      </Box>
      <Box>
        <Button
          component={Link}
          target="__blank"
          to={info.trainPosURL ?? ""}
          endIcon={<OpenInNew />}
          disabled={!info.trainPosURL}
        >
          列車走行位置
        </Button>
        {isAdmin && <EditableText text={info.trainPosURL ?? ""} onChangeText={handleUpdateTrainPos} />}
      </Box>
    </Collapser>
  );
};

export default TimetableURL;
