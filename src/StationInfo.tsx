import React from 'react';
import { useParams } from "react-router-dom";
import { useStationInfo } from "./Api";

const StationInfo = () => {
  const { stationCode } = useParams<"stationCode">();

  const station = useStationInfo(Number(stationCode));
  const info = station.data;

  if(station.isLoading){
    return (
      <>
        <p>Loading...</p>
      </>
    );
  }

  return (
    <>
      <p>StationInfo</p>
      <div>
        <p>stationCode: {info?.stationCode}</p>
        <p>railwayName: {info?.railwayName}</p>
        <p>railwayCompany: {info?.railwayCompany}</p>
        <p>latitude: {info?.latitude}</p>
        <p>longitude: {info?.longitude}</p>
      </div>
    </>
  );
};

export default StationInfo;
