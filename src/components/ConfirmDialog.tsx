import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

const ConfirmDialog = <T,>(
  { open, selectedValue, onClose, title, descriptionFn }
  :{
    open: boolean,
    selectedValue: T | undefined,
    onClose: (value: T | undefined) => void,
    title: string,
    descriptionFn: (value: T) => string,
  }
) => {
  return (
    <Dialog
      open={open}
      onClose={() => onClose(undefined)}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {selectedValue && descriptionFn(selectedValue)}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(undefined)} autoFocus>キャンセル</Button>
        <Button color="error" onClick={() => onClose(selectedValue)}>削除</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
