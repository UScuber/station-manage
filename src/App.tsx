import { memo } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert, Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AuthProvider, getAuth } from "./auth/auth";
import Header from "./components/Header";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Top from "./pages/Top";
import Footer from "./components/Footer";
import StationList from "./pages/StationList";
import StationInfo from "./pages/StationInfo";
import StationGroupInfo from "./pages/StationGroupInfo";
import RailwayList from "./pages/RailwayList";
import RailwayInfo from "./pages/RailwayInfo";
import SearchStation from "./pages/SearchStation";
import History from "./pages/History";
import NotFound from "./pages/NotFound";
import CompanyList from "./pages/CompanyList";
import CompanyInfo from "./pages/CompanyInfo";
import PrefectureInfo from "./pages/PrefectureInfo";
import PrefectureList from "./pages/PrefectureList";
import HistoryMap from "./pages/HistoryMap";


declare module "@mui/material/styles" {
  interface Palette {
    access: Palette["primary"];
    complete: Palette["primary"];
  }

  interface PaletteOptions {
    access?: PaletteOptions["primary"];
    complete?: PaletteOptions["primary"];
  }
}

let theme = createTheme({
  typography: {
    fontFamily: [
      '"Hiragino Kaku Gothic Pro"',
      '"Hiragino Sans"',
      "arial",
      "Meiryo",
      '"MS PGothic"',
      "sans-serif",
    ].join(","),
    button: {
      textTransform: "none",
    },
  },
});

theme = createTheme(theme, {
  palette: {
    access: theme.palette.augmentColor({
      color: {
        main: "#d1e3f5",
      },
      name: "access",
    }),
    complete: theme.palette.augmentColor({
      color: {
        main: "#d6ebdd",
        light: "#dff0e3",
        dark: "#cfebd5",
      },
      name: "complete",
    }),
  },
});

theme.typography.h3 = {
  fontSize: 45,
  fontWeight: 500,
  [theme.breakpoints.down("md")]: {
    fontSize: 28,
    fontWeight: 600,
  },
};


const Notification = memo(() => {
  const location = useLocation();
  const state = location.state;

  if(!state || !state.message || !state.url || state.url !== location.pathname){
    return (
      <Box sx={{ mt: 8 }}></Box>
    );
  }
  return (
    <Alert severity="success" sx={{ mt: 1.3, mb: 0.7 }}>{state.message}</Alert>
  );
});


const AppChild = () => {
  const auth = getAuth();

  return (
    <AuthProvider value={auth}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Header />
          <Notification />
          <Routes>
            <Route path="/" element={<Top />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/stationList" element={<StationList />} />
            <Route path="/station/:stationCode" element={<StationInfo />} />
            <Route path="/stationGroup/:stationGroupCode" element={<StationGroupInfo />} />
            <Route path="/railway" element={<RailwayList />} />
            <Route path="/railway/:railwayCode" element={<RailwayInfo />} />
            <Route path="/company" element={<CompanyList />} />
            <Route path="/company/:companyCode" element={<CompanyInfo />} />
            <Route path="/pref" element={<PrefectureList />} />
            <Route path="/pref/:prefCode" element={<PrefectureInfo />} />
            <Route path="/searchStation" element={<SearchStation />} />
            <Route path="/history" element={<History />} />
            <Route path="/historyMap" element={<HistoryMap />} />
            <Route path="/*" element={<NotFound />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};


const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AppChild />
    </QueryClientProvider>
  );
};

export default App;
