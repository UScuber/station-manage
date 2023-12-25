import { useQuery, UseQueryResult, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

axios.defaults.baseURL = process.env.REACT_APP_API_BASEURL;

const ngrok_header = { headers: { "ngrok-skip-browser-warning": "a" } };

const convert_date = (date: Date): string => {
  return new Date(date).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
};

export type Station = {
  stationCode: number,
  stationName: string,
  companyCode: number,
  railwayCode: number,
  stationGroupCode: number,
  railwayName: string,
  railwayCompany: string,
  latitude: number,
  longitude: number,
  getDate: Date | null,
  passDate: Date | null,
};

export const useStationInfo = (code: number | undefined): UseQueryResult<Station> => {
  return useQuery<Station>({
    queryKey: ["Station", code],
    queryFn: async() => {
      const { data } = await axios.get<Station>("/api/station/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
  });
};


export const useStationsInfoByGroupCode = (code: number | undefined): UseQueryResult<Station[]> => {
  return useQuery<Station[]>({
    queryKey: ["Station", code],
    queryFn: async() => {
      const { data } = await axios.get<Station[]>("/api/stationsByGroupCode/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
  });
};



export type StationGroup = {
  stationGroupCode: number, 
  stationName: string,
  latitude: number,
  longitude: number,
  date: Date | null,
  distance?: number,
};

export const useStationGroupInfo = (code: number | undefined): UseQueryResult<StationGroup> => {
  return useQuery<StationGroup>({
    queryKey: ["StationGroup", code],
    queryFn: async() => {
      const { data } = await axios.get<StationGroup>("/api/stationGroup/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
  });
};


export const useStationGroupList = (offset: number, length: number): UseQueryResult<StationGroup[]> => {
  return useQuery<StationGroup[]>({
    queryKey: ["StationGroupList", offset, length],
    queryFn: async() => {
      const { data } = await axios.get<StationGroup[]>(`/api/stationGroupList?off=${offset}&len=${length}`, ngrok_header);
      return data;
    },
    enabled: offset !== undefined && length !== undefined,
  });
};


export const useStationGroupCount = (): UseQueryResult<number> => {
  return useQuery<number>({
    queryKey: ["StationGroupCount"],
    queryFn: async() => {
      const { data } = await axios.get<number>("/api/stationGroupCount", ngrok_header);
      return data;
    },
  });
};


export const useSearchStationName = (name: string | undefined): UseQueryResult<Station[]> => {
  return useQuery<Station[]>({
    queryKey: ["SearchStationName", name],
    queryFn: async() => {
      const { data } = await axios.get<Station[]>("/api/searchStationName?name=" + name, ngrok_header);
      return data;
    },
    enabled: name !== undefined,
  });
};


export type Coordinate = {
  lat: number,
  lng: number,
};

export const useSearchNearestStationGroup = (pos: Coordinate | undefined): UseQueryResult<StationGroup> => {
  return useQuery<StationGroup>({
    queryKey: ["SearchNearestStationGroup", pos],
    queryFn: async() => {
      const { data } = await axios.get<StationGroup[]>(`/api/searchNearestStationGroup?lat=${pos?.lat}&lng=${pos?.lng}`, ngrok_header);
      return data[0];
    },
    enabled: pos !== undefined,
  });
};


export const useSearchKNearestStationGroups = (pos: Coordinate | undefined, num?: number): UseQueryResult<StationGroup[]> => {
  return useQuery<StationGroup[]>({
    queryKey: ["SearchKNearestStationGroups", pos, num ?? 0],
    queryFn: async() => {
      const { data } = await axios.get<StationGroup[]>(`/api/searchNearestStationGroup?lat=${pos?.lat}&lng=${pos?.lng}&num=${num ?? ""}`, ngrok_header);
      return data;
    },
    enabled: pos !== undefined,
  });
};


export type StationHistory = {
  stationCode: number,
  date: Date,
  state: number,
};

export const useStationHistoryList = (offset: number, length: number): UseQueryResult<StationHistory[]> => {
  return useQuery<StationHistory[]>({
    queryKey: ["StationHistoryList", offset, length],
    queryFn: async() => {
      const { data } = await axios.get<StationHistory[]>(`/api/stationHistory?off=${offset}&len=${length}`, ngrok_header);
      return data;
    },
    enabled: offset !== undefined || length !== undefined,
  });
};


export const useStationHistoryCount = (): UseQueryResult<number> => {
  return useQuery<number>({
    queryKey: ["StationHistoryCount"],
    queryFn: async() => {
      const { data } = await axios.get<number>("/api/stationHistoryCount", ngrok_header);
      return data;
    },
  });
};


export const useSendStationStateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(req: StationHistory) => {
      const { data } = await axios.get<string>(`/api/postStationDate?code=${req.stationCode}&state=${req.state}&date=${convert_date(req.date)}`, ngrok_header);
      return data;
    },
    onSuccess: (data: string, variables: StationHistory) => {
      queryClient.invalidateQueries({ queryKey: ["Station", variables.stationCode] });
    },
    onError: (err: Error) => {
      console.error(err);
    }
  });
};


export type StationGroupHistory = {
  stationGroupCode: number,
  date: Date,
};

export const useSendStationGroupStateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(req: StationGroupHistory) => {
      const { data } = await axios.get<string>(`/api/postStationGroupDate?code=${req.stationGroupCode}&date=${convert_date(req.date)}`, ngrok_header);
      return data;
    },
    onSuccess: (data: string, variables: StationGroupHistory) => {
      queryClient.invalidateQueries({ queryKey: ["StationGroup", variables.stationGroupCode] });
    },
    onError: (err: Error) => {
      console.error(err);
    }
  });
};


export const useDeleteStationHistoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(req: StationHistory) => {
      const { data } = await axios.get<string>(`/api/deleteStationDate?code=${req.stationCode}&state=${req.state}&date=${convert_date(req.date)}`, ngrok_header);
      return data;
    },
    onSuccess: (data: string, variables: StationHistory) => {
      queryClient.invalidateQueries({ queryKey: ["Station", variables.stationCode] });
    },
    onError: (err: Error) => {
      console.error(err);
    }
  });
};


export const useDeleteStationGroupHistoryMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(req: StationGroupHistory) => {
      const { data } = await axios.get<string>(`/api/deleteStationGroupState?code=${req.stationGroupCode}&date=${convert_date(req.date)}`, ngrok_header);
      return data;
    },
    onSuccess: (data: string, variables: StationGroupHistory) => {
      queryClient.invalidateQueries({ queryKey: ["StationGroup", variables.stationGroupCode] });
    },
    onError: (err: Error) => {
      console.error(err);
    }
  });
};
