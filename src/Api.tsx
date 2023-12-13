import React from "react";
import { useQuery, UseQueryResult, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

export type Station = {
  stationCode: number,
  stationName: string,
  companyCode: number,
  railwayCode: number,
  stationGroupCode: number,
  railwayName: string,
  railwayCompany: string,
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


export const useStationsInfoByGroupCode = (code: number): UseQueryResult<Station[]> => {
  return useQuery<Station[]>({
    queryKey: ["Stations", code],
    queryFn: async() => {
      const { data } = await axios.get<Station[]>("/api/stationsByGroupCode/" + code);
      return data;
    },
    enabled: code !== undefined,
  });
};


export type StationState = {
  stationCode: number,
  getDate: Date | null,
  passDate: Date | null
};

export const useStationState = (code: number): UseQueryResult<StationState> => {
  return useQuery<StationState>({
    queryKey: ["StationState", code],
    queryFn: async() => {
      const { data } = await axios.get<StationState>("/api/stationState/" + code);
      return data;
    },
    enabled: code !== undefined,
  });
};


export type StationGroupState = {
  stationGroupCode: number,
  date: Date | null,
};

export const useStationGroupState = (code: number): UseQueryResult<StationGroupState> => {
  return useQuery<StationGroupState>({
    queryKey: ["StationGroupState", code],
    queryFn: async() => {
      const { data } = await axios.get<StationGroupState>("/api/stationState/" + code);
      return data;
    },
    enabled: code !== undefined,
  });
};


export const useSearchStationName = (name: string): UseQueryResult<Station[]> => {
  return useQuery<Station[]>({
    queryKey: ["SearchStationName", name],
    queryFn: async() => {
      const { data } = await axios.get<Station[]>("/api/searchStationName?name=" + name);
      return data;
    },
    enabled: name !== undefined,
  });
};


export type Coordinate = {
  lat: number,
  lng: number
};

export const useSearchNearestStationGroup = (pos: Coordinate): UseQueryResult<number> => {
  return useQuery<number>({
    queryKey: ["SearchNearestStationGroup", pos],
    queryFn: async() => {
      const { data } = await axios.get<number>(`/api/searchNearestStationGroup?lat=${pos.lat}&lng=${pos.lng}`);
      return data;
    },
    enabled: pos !== undefined,
  });
};


export type StationHistory = {
  stationCode: number,
  date: Date,
  state: number
};

export const useStationHistoryList = (offset: number, length: number): UseQueryResult<StationHistory[]> => {
  return useQuery<StationHistory[]>({
    queryKey: ["StationHistoryList", offset, length],
    queryFn: async() => {
      const { data } = await axios.get<StationHistory[]>(`/api/stationHistory?off=${offset}&len=${length}`);
      return data;
    },
    enabled: offset !== undefined || length !== undefined,
  });
};


export const useSendStationStateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(req: StationHistory) => {
      const { data } = await axios.get<string>(`/api/postStationDate?code=${req.stationCode}&state=${req.state}&date=${req.date.toString()}`);
      return data;
    },
    onSuccess: (data: string) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["StationState"] });
    },
    onError: (err: Error) => {
      console.error(err);
    }
  });
};


export type StationGroupHistory = {
  stationGroupCode: number,
  date: Date
};

export const useSendStationGroupStateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(req: StationGroupHistory) => {
      const { data } = await axios.get<string>(`/api/postStationGroupState?code=${req.stationGroupCode}&date=${req.date.toString()}`);
      return data;
    },
    onSuccess: (data: string) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ["StationGroupState"] });
    },
    onError: (err: Error) => {
      console.error(err);
    }
  });
};
