import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import StationList from "./StationList";
import StationInfo from "./StationInfo";
import SearchStation from "./SearchStation";

const App = () => {
  return (
    <div className="App">
      <p>header</p>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<p>hello</p>} />
          <Route path="/stationList" element={<StationList />} />
          <Route path="/station/:stationCode" element={<StationInfo />} />
          <Route path="/searchStation/" element={<SearchStation />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
