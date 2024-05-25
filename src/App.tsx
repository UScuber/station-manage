import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert, Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Header from "./Header";
import Signin from "./pages/Signin";
import Login from "./pages/Login";
import Top from "./Top";
import Footer from "./Footer";
import StationList from "./StationList";
import StationInfo from "./StationInfo";
import StationGroupInfo from "./StationGroupInfo";
import RailwayList from "./RailwayList";
import RailwayInfo from "./RailwayInfo";
import SearchStation from "./SearchStation";
import History from "./History";
import NotFound from "./NotFound";
import CompanyList from "./CompanyList";
import CompanyInfo from "./CompanyInfo";
import PrefectureInfo from "./PrefectureInfo";
import PrefectureList from "./PrefectureList";
import HistoryMap from "./HistoryMap";
import { AuthProvider, getAuth } from "./auth/auth";
import { memo, useEffect, useState } from "react";


declare module "@mui/material/styles" {
  interface Palette {
    access: Palette["primary"];
  }

  interface PaletteOptions {
    access?: PaletteOptions["primary"];
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
        // main: "#cfebd5",
        main: "#d1e3f5",
      },
      name: "access",
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
  const [state, setState] = useState<{ message?: string, url: string } | null>(location.state as { message?: string, url: string });

  useEffect(() => {
    if(state && state.url !== location.pathname){
      setState({ url: state.url });
    }else if(state){
      window.history.pushState({}, "", "/");
    }
  }, [location]);

  if(!state || !state.message || state.url !== location.pathname){
    return <Box sx={{ mt: 8 }}></Box>;
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
            <Route path="/signin" element={<Signin />} />
            <Route path="/login" element={<Login />} />
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
