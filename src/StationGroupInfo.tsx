import React from 'react';
import { useParams } from "react-router-dom";

const StationInfo = () => {
  const { stationGroupCode } = useParams<"stationGroupCode">();

  return (
    <>
      <p>StationGroupInfo</p>
      <div>
        <p>stationGroupCode: {stationGroupCode}</p>
      </div>
    </>
  );
};

export default StationInfo;
