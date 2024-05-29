import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useAuth } from "../auth/auth";
import { AccountCircle } from "@mui/icons-material";

const navItems: Array<{ text: string, url: string }> = [
  { text: "List", url: "/stationList" },
  { text: "Search", url: "/searchStation" },
  { text: "History", url: "/history" },
];

const drawerWidth = 240;

const Header = () => {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: { xs: 1, sm: 0 }, mr: 1, display: "block" }}
          >
            <Button
              component={Link}
              color="inherit"
              to="/"
              sx={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}
            >
              Station Manage
            </Button>
          </Typography>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: { xs: "none", sm: "block", textAlign: "center" } }}>
            <List component="nav" sx={{ display: "flex", justifyContent: "flex-start" }}>
              {navItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton component={Link} to={item.url} sx={{ textAlign: "center" }}>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          <Box sx={{ display: { xs: "none", sm: "block" }, flexGrow: 1 }} />
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            {!isAuthenticated && (<>
              <Button component={Link} color="inherit" to="/login">
                <ListItemText primary="Login" />
              </Button>
              <Button component={Link} color="inherit" to="/signup">
                <ListItemText primary="Signup" />
              </Button>
            </>)}
            {isAuthenticated && (
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                component={Link}
                to="/profile"
                color="inherit"
              >
                <AccountCircle />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <nav>
        <Drawer
          container={window.document.body}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
            <Typography variant="h6" sx={{ my: 2 }}>
              <Button
                component={Link}
                color="inherit"
                to="/"
                sx={{ fontSize: "20px" }}
              >
                Station Manage
              </Button>
            </Typography>
            <Divider />
            <List>
              {navItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton component={Link} to={item.url} sx={{ textAlign: "center" }}>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            <Divider sx={{ mx: "auto", width: "80%" }} />
            {!isAuthenticated && (
              <List>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/login" sx={{ textAlign: "center" }}>
                    <ListItemText primary="Login" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/signup" sx={{ textAlign: "center" }}>
                    <ListItemText primary="Signup" />
                  </ListItemButton>
                </ListItem>
              </List>
            )}
            {isAuthenticated && (
              <ListItem disablePadding>
                <ListItemButton component={Link} to="/profile" sx={{ textAlign: "center" }}>
                  <ListItemText primary="Profile" />
                </ListItemButton>
              </ListItem>
            )}
          </Box>
        </Drawer>
      </nav>
    </>
  );
};

export default Header;
