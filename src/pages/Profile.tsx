import { ChangeEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  DialogContentText,
  Divider,
  FormHelperText,
  ListItemText,
  Typography,
  styled,
} from "@mui/material";
import {
  ExportHistoryJSON,
  useExportHistoryMutation,
  useImportHistoryMutation,
} from "../api";
import { useAuth } from "../auth";
import { ConfirmDialog } from "../components";


const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const UploadButton = () => {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFilename, setSelectedFilename] = useState("");
  const [fileContent, setFileContent] = useState("");

  const importMutation = useImportHistoryMutation();

  const uploadFile = () => {
    const json = JSON.parse(fileContent) as ExportHistoryJSON;
    importMutation.mutate(json);
  };

  const handleClose = (value: number | undefined) => {
    setOpen(false);
    // OK
    if(value) uploadFile();

    setSelectedFilename("");
    setFileContent("");
    setErrorMessage("");
  };

  const UploadForm = () => {
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.currentTarget.files;
      if(!files || !files.length) return;

      const file = files[0];
      if(file.name.substring(file.name.lastIndexOf(".")+1) !== "json"){
        setErrorMessage("JSONファイルを選択してください");
        return;
      }
      setSelectedFilename(file.name);

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setFileContent(typeof reader.result === "string" ? reader.result : "");
      });
      reader.readAsText(file, "UTF-8");
    };

    return (
      <Box>
        <FormHelperText sx={{ m: 0 }} error>今までの履歴は消されます</FormHelperText>
        <Button
          component="label"
          variant="contained"
          role={undefined}
          tabIndex={-1}
        >
          ファイルを選択
          <VisuallyHiddenInput type="file" accept=".json" onChange={handleFileChange} />
        </Button>
        <DialogContentText
          variant="h6"
          sx={{ fontSize: 14, ml: 1,  display: "inline" }}
        >
          {selectedFilename}
        </DialogContentText>
        <FormHelperText error>{errorMessage}</FormHelperText>
      </Box>
    );
  };


  return (
    <Box>
      <Button
        variant="outlined"
        onClick={() => setOpen(true)}
      >
        Upload
      </Button>
      <ConfirmDialog
        open={open}
        selectedValue={1}
        onClose={handleClose}
        descriptionFn={() => <UploadForm />}
        title="ファイルを選択してください"
        deleteButtonText="送信"
      />
    </Box>
  );
};


const DownloadButton = () => {
  const [open, setOpen] = useState(false);

  const exportMutation = useExportHistoryMutation(data => {
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "station-history.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  const DownloadForm = () => {
    return (
      <Box sx={{ textAlign: "center" }}>
        <Button
          variant="contained"
          onClick={() => exportMutation.mutate()}
        >
          ダウンロード
        </Button>
      </Box>
    );
  };


  return (
    <Box>
      <Button
        variant="outlined"
        onClick={() => setOpen(true)}
      >
        Download
      </Button>
      <ConfirmDialog
        open={open}
        selectedValue={1}
        onClose={() => setOpen(false)}
        descriptionFn={() => <DownloadForm />}
        title="ダウンロードしますか"
        deleteButtonText="確認"
      />
    </Box>
  );
};


const Profile = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const [open, setOpen] = useState(false);
  const navigation = useNavigate();
  const logoutMutation = logout(
    () => {
      navigation("/", { state: { message: "ログアウトしました", url: "/" }, replace: true });
    }
  );

  useEffect(() => {
    if(!isLoading && !isAuthenticated){
      navigation("/");
    }
  }, [isAuthenticated, isLoading]);

  const handleClose = (value: number | undefined) => {
    setOpen(false);
    if(!value || !user) return;
    
    logoutMutation.mutate(user);
  };

  
  if(isLoading || !user){
    return (
      <Container>
        <Typography variant="h6">Loading...</Typography>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4">{user.userName}</Typography>
      <Divider sx={{ mt: 0.5, mb: 2 }} />

      <Box>
      </Box>

      <Box sx={{ my: 4 }} />

      <Typography variant="h6" sx={{ fontSize: 16 }}>乗降履歴をダウンロードする(json)</Typography>
      <DownloadButton />
      <Typography variant="h6" sx={{ fontSize: 16, mt: 2}}>乗降履歴をアップロードする(json)</Typography>
      <UploadButton />

      <Divider sx={{ mt: 3, mb: 2 }} />

      <ConfirmDialog
        open={open}
        selectedValue={1}
        onClose={handleClose}
        descriptionFn={() => ""}
        title="ログアウトしますか"
        deleteButtonText="確認"
      />
      <Button
        variant="outlined"
        color="error"
        onClick={() => setOpen(!open)}
      >
        <ListItemText primary="Logout" />
      </Button>
    </Container>
  );
};

export default Profile;
