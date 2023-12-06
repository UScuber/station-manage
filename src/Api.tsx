import React from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import axios from "axios";

export type Station = {
  stationCode: number,
  companyCode: number,
  railwayCode: number,
  stationGroupCode: number,
  railwayName: String,
  railwayCompany: String,
  latitude: number,
  longitude: number
};

export const useStationInfo = (code: number): UseQueryResult<Station> => {
  return useQuery<Station>({
    queryKey: ["Station", code],
    queryFn: async() => {
      const { data } = await axios.get<Station>("/api/station/" + code);
      return data;
    },
    enabled: code !== undefined,
  });
};
