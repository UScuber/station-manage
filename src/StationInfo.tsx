import React from 'react';
import { useParams } from "react-router-dom";

const StationInfo = () => {
  const { stationCode } = useParams<"stationCode">();

  return (
    <>
      <p>StationInfo</p>
      <code>{stationCode}</code>
    </>
  );
};

export default StationInfo;
