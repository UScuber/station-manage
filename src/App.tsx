import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider, Toolbar, createTheme, styled } from "@mui/material";
import Header from "./Header";
import Top from "./Top";
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


const theme = createTheme({
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

const ThinToolbar = styled(Toolbar)(({ theme }) => ({
  minHeight: 25,
}));

const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Header />
          <ThinToolbar />
          <Routes>
            <Route path="/" element={<Top />} />
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
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
