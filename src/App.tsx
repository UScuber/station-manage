import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from "./Header";
import StationList from "./StationList";
import StationInfo from "./StationInfo";
import SearchStation from "./SearchStation";

const App = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<p>hello</p>} />
          <Route path="/stationList" element={<StationList />} />
          <Route path="/station/:stationCode" element={<StationInfo />} />
          <Route path="/searchStation/" element={<SearchStation />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
