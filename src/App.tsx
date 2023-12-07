import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline } from "@mui/material";
import Header from "./Header";
import Top from "./Top";
import StationList from "./StationList";
import StationInfo from "./StationInfo";
import StationGroupInfo from "./StationGroupInfo";
import SearchStation from "./SearchStation";

const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <CssBaseline />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Top />} />
          <Route path="/stationList" element={<StationList />} />
          <Route path="/station/:stationCode" element={<StationInfo />} />
          <Route path="/stationGroup/:stationGroupCode" element={<StationGroupInfo />} />
          <Route path="/searchStation" element={<SearchStation />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
