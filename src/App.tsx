import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, Toolbar } from "@mui/material";
import Header from "./Header";
import Top from "./Top";
import StationList from "./StationList";
import StationInfo from "./StationInfo";
import StationGroupInfo from "./StationGroupInfo";
import SearchStation from "./SearchStation";
import History from "./History";
import NotFound from "./NotFount";

const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <CssBaseline />
      <BrowserRouter>
        <Header />
        <Toolbar />
        <Routes>
          <Route path="/" element={<Top />} />
          <Route path="/stationList" element={<StationList />} />
          <Route path="/station/:stationCode" element={<StationInfo />} />
          <Route path="/stationGroup/:stationGroupCode" element={<StationGroupInfo />} />
          <Route path="/searchStation" element={<SearchStation />} />
          <Route path="/history" element={<History />} />
          <Route path="/*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
