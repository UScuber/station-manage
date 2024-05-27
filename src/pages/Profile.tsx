import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { useAuth } from "../auth/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../components";

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

      <Toolbar />
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
