import { useQuery, UseQueryResult, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_API_BASEURL;

// 日付をDate型に変換する
axios.interceptors.response.use(res => {
  const dateFormat = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  for(const key of Object.keys(res.data)){
    const value = res.data[key];
    if(typeof value === "string" && dateFormat.test(value)){
      res.data[key] = new Date(value);
      continue;
    }
    if(value === null){
      res.data[key] = undefined;
      continue;
    }
    if(typeof value === "object"){
      for(const k of Object.keys(value)){
        const val = value[k];
        if(typeof val === "string" && dateFormat.test(val)){
          res.data[key][k] = new Date(val);
        }
      }
    }
  }
  return res;
});

const ngrok_header = { headers: { "ngrok-skip-browser-warning": "a" } };

const convert_date = (date: Date) => {
  return new Date(date).toLocaleString(
    "ja-JP",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  ).replaceAll("/", "-");
};

export enum RecordState {
  Get,
  Pass,
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
  getDate: Date | undefined,
  passDate: Date | undefined,
  prefCode: number,
  prefName: string,
  kana: string,
  railwayColor: string,
  left: number[],
  right: number[],
};

// 駅情報取得
export const useStationInfo = (
  code: number | undefined,
  onSuccessFn?: (data: Station) => unknown
): UseQueryResult<Station> => {
  return useQuery<Station>({
    queryKey: ["Station", code],
    queryFn: async() => {
      const { data } = await axios.get<Station>("/api/station/" + code, ngrok_header);
      onSuccessFn && onSuccessFn(data);
      return data;
    },
    enabled: code !== undefined,
  });
};


// 駅グループに属する駅の駅情報を取得
export const useStationsInfoByGroupCode = (code: number | undefined): UseQueryResult<Station[]> => {
  return useQuery<Station[]>({
    queryKey: ["GroupStations", code],
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
  date: Date | undefined,
  prefCode: number,
  prefName: string,
  kana: string,
  distance?: number,
};

// 駅グループの情報取得
export const useStationGroupInfo = (
  code: number | undefined,
  onSuccessFn?: (data: StationGroup) => unknown
): UseQueryResult<StationGroup> => {
  return useQuery<StationGroup>({
    queryKey: ["StationGroup", code],
    queryFn: async() => {
      const { data } = await axios.get<StationGroup>("/api/stationGroup/" + code, ngrok_header);
      onSuccessFn && onSuccessFn(data);
      return data;
    },
    enabled: code !== undefined,
  });
};


export type Railway = {
  railwayCode: number,
  railwayName: string,
  companyCode: number,
  companyName: string,
  railwayKana: string,
  formalName: string,
  railwayColor: string,
};

// 路線情報取得
export const useRailwayInfo = (code: number | undefined): UseQueryResult<Railway> => {
  return useQuery<Railway>({
    queryKey: ["Railway", code],
    queryFn: async() => {
      const { data } = await axios.get<Railway>("/api/railway/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
    staleTime: Infinity,
  });
};


// 路線情報全取得
export const useRailwayList = (): UseQueryResult<Railway[]> => {
  return useQuery<Railway[]>({
    queryKey: ["Railway"],
    queryFn: async() => {
      const { data } = await axios.get<Railway[]>("/api/railway", ngrok_header);
      return data;
    },
    staleTime: Infinity,
  });
};


// 路線に属する駅の駅情報を取得
export const useStationsInfoByRailwayCode = (
  code: number | undefined,
  onSuccessFn?: (data: Station[]) => unknown
): UseQueryResult<Station[]> => {
  return useQuery<Station[]>({
    queryKey: ["RailwayStations", code],
    queryFn: async() => {
      const { data } = await axios.get<Station[]>("/api/railwayStations/" + code, ngrok_header);
      onSuccessFn && onSuccessFn(data);
      return data;
    },
    enabled: code !== undefined,
  });
};


export type Company = {
  companyCode: number,
  companyName: string,
  formalName: string,
};

// 会社情報取得
export const useCompanyInfo = (code: number | undefined): UseQueryResult<Company> => {
  return useQuery<Company>({
    queryKey: ["Company", code],
    queryFn: async() => {
      const { data } = await axios.get<Company>("/api/company/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
    staleTime: Infinity,
  });
};


// 会社情報全取得
export const useCompanyList = (): UseQueryResult<Company[]> => {
  return useQuery<Company[]>({
    queryKey: ["Company"],
    queryFn: async() => {
      const { data } = await axios.get<Company[]>("/api/company", ngrok_header);
      return data;
    },
    staleTime: Infinity,
  });
};


// 会社に属する路線の路線情報を取得
export const useRailwaysInfoByCompanyCode = (code: number | undefined): UseQueryResult<Railway[]> => {
  return useQuery<Railway[]>({
    queryKey: ["CompanyRailways", code],
    queryFn: async() => {
      const { data } = await axios.get<Railway[]>("/api/companyRailways/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
    staleTime: Infinity,
  });
};


// 会社に属する路線の駅情報を全取得
export const useStationsInfoByCompanyCode = (code: number | undefined): UseQueryResult<Station[]> => {
  return useQuery<Station[]>({
    queryKey: ["CompanyStations", code],
    queryFn: async() => {
      const { data } = await axios.get<Station[]>("/api/companyStations/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
  });
};


// 県に属する路線の路線情報を取得
export const useRailwaysInfoByPrefCode = (code: number | undefined): UseQueryResult<Railway[]> => {
  return useQuery<Railway[]>({
    queryKey: ["PrefRailways", code],
    queryFn: async() => {
      const { data } = await axios.get<Railway[]>("/api/prefRailways/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
    staleTime: Infinity,
  });
};


// 県に属する路線の駅情報を全取得
export const useStationsInfoByPrefCode = (code: number | undefined): UseQueryResult<Station[]> => {
  return useQuery<Station[]>({
    queryKey: ["PrefStations", code],
    queryFn: async() => {
      const { data } = await axios.get<Station[]>("/api/prefStations/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
  });
};


// 駅グループを名前で検索、区間指定
export const useSearchStationGroupList = (
  { offset, length, name }
  :{
    offset: number,
    length: number,
    name: string | undefined,
  }
): UseQueryResult<StationGroup[]> => {
  return useQuery<StationGroup[]>({
    queryKey: ["StationGroupList", offset, length, name],
    queryFn: async() => {
      const { data } = await axios.get<StationGroup[]>(`/api/searchStationGroupList?off=${offset}&len=${length}&name=${name ?? ""}`, ngrok_header);
      return data;
    },
  });
};


// 駅グループを名前で検索した際の件数
export const useSearchStationGroupCount = (
  { name }
  :{
    name: string | undefined,
  }
): UseQueryResult<number> => {
  return useQuery<number>({
    queryKey: ["StationGroupCount", name],
    queryFn: async() => {
      const { data } = await axios.get<number>(`/api/searchStationGroupCount?name=${name ?? ""}`, ngrok_header);
      return data;
    },
  });
};


export type Coordinate = {
  lat: number,
  lng: number,
};

// 座標から近い駅/駅グループを複数取得
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


export type Prefecture = {
  prefCode: number,
  prefName: string,
};

// 都道府県名を取得
export const usePrefName = (code: number | undefined): UseQueryResult<Prefecture> => {
  return useQuery<Prefecture>({
    queryKey: ["Prefecture", code],
    queryFn: async() => {
      const { data } = await axios.get<Prefecture>("/api/pref/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
    staleTime: Infinity,
  });
};


// 都道府県名を全取得
export const usePrefList = (): UseQueryResult<Prefecture[]> => {
  return useQuery<Prefecture[]>({
    queryKey: ["Prefecture"],
    queryFn: async() => {
      const { data } = await axios.get<Prefecture[]>("/api/pref", ngrok_header);
      return data;
    },
    staleTime: Infinity,
  });
};


export type PathData = {
  type: "Feature",
  geometry: {
    type: "MultiLineString",
    coordinates: [number, number][][],
  },
  properties: Railway,
};

// 路線の線路のpathを取得
export const useRailPath = (railwayCode: number | undefined): UseQueryResult<PathData> => {
  return useQuery<PathData>({
    queryKey: ["RailPath", railwayCode],
    queryFn: async() => {
      const { data } = await axios.get<PathData>("/api/railpaths/" + railwayCode, ngrok_header);
      return data;
    },
    enabled: railwayCode !== undefined,
    staleTime: Infinity,
  });
};


// 会社に属する全路線の線路のpathを取得
export const useRailPathByCompanyCode = (companyCode: number | undefined): UseQueryResult<PathData[]> => {
  return useQuery<PathData[]>({
    queryKey: ["RailPathList", companyCode],
    queryFn: async() => {
      const { data } = await axios.get<PathData[]>("/api/pathslist/" + companyCode, ngrok_header);
      return data;
    },
    enabled: companyCode !== undefined,
    staleTime: Infinity,
  });
};


export type StationHistory = {
  stationCode: number,
  stationGroupCode: number,
  date: Date,
  state: number,
};

export type StationHistoryDetail = Station & StationHistory;

// 乗降/通過の履歴を区間取得
export const useStationHistoryList = (offset: number, length: number, name?: string, type?: string): UseQueryResult<StationHistoryDetail[]> => {
  return useQuery<StationHistoryDetail[]>({
    queryKey: ["StationHistoryList", offset, length, name, type],
    queryFn: async() => {
      const { data } = await axios.get<StationHistoryDetail[]>(`/api/stationHistory?off=${offset}&len=${length}&name=${name}&type=${type}`, ngrok_header);
      return data;
    },
  });
};


// 乗降/通過の履歴の個数を取得
export const useStationHistoryCount = (name?: string, type?: string): UseQueryResult<number> => {
  return useQuery<number>({
    queryKey: ["StationHistoryCount", name, type],
    queryFn: async() => {
      const { data } = await axios.get<number>(`/api/stationHistoryCount?name=${name}&type=${type}`, ngrok_header);
      return data;
    },
  });
};


// 駅情報を付与した履歴を取得
export const useStationHistoryListAndInfo = (): UseQueryResult<StationHistoryDetail[]> => {
  return useQuery<StationHistoryDetail[]>({
    queryKey: ["StationHistoryDetail"],
    queryFn: async() => {
      const { data } = await axios.get<StationHistoryDetail[]>("/api/stationHistoryAndInfo", ngrok_header);
      return data;
    },
  });
};


// 駅の履歴を取得
export const useStationAllHistory = (
  code: number | undefined,
  onSuccessFn?: (data: StationHistory[]) => unknown
): UseQueryResult<StationHistory[]> => {
  return useQuery<StationHistory[]>({
    queryKey: ["StationHistory", code],
    queryFn: async() => {
      const { data } = await axios.get<StationHistory[]>("/api/stationHistory/" + code, ngrok_header);
      onSuccessFn && onSuccessFn(data);
      return data;
    },
    enabled: code !== undefined,
  });
};


export type StationHistoryData = {
  stationGroupCode: number,
  stationCode: number | undefined,
  date: Date,
  state: number,
  railwayName?: string,
  railwayColor?: string,
};

// 駅グループ全体の履歴を取得(各駅の行動も含める)
export const useStationGroupAllHistory = (
  code: number | undefined,
  onSuccessFn?: (data: StationHistoryData[]) => unknown
): UseQueryResult<StationHistoryData[]> => {
  return useQuery<StationHistoryData[]>({
    queryKey: ["StationGroupHistory", code],
    queryFn: async() => {
      const { data } = await axios.get<StationHistoryData[]>("/api/stationGroupHistory/" + code, ngrok_header);
      onSuccessFn && onSuccessFn(data);
      return data;
    },
    enabled: code !== undefined,
  });
};


export type StationProgress = {
  stationNum: number,
  getOrPassStationNum: number,
};

// 路線の駅の個数と乗降/通過した駅の個数を取得
export const useRailwayProgress = (code: number | undefined): UseQueryResult<StationProgress> => {
  return useQuery<StationProgress>({
    queryKey: ["RailwayProgress", code],
    queryFn: async() => {
      const { data } = await axios.get<StationProgress>("/api/railwayProgress/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
  });
};


// 会社の駅の個数と乗降/通過した駅の個数を取得
export const useCompanyProgress = (code: number | undefined): UseQueryResult<StationProgress> => {
  return useQuery<StationProgress>({
    queryKey: ["CompanyProgress", code],
    queryFn: async() => {
      const { data } = await axios.get<StationProgress>("/api/companyProgress/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
  });
};


// 都道府県の駅の個数と乗降/通過した駅の個数を取得(駅グループを1つとはしない)
export const usePrefProgress = (code: number | undefined): UseQueryResult<StationProgress> => {
  return useQuery<StationProgress>({
    queryKey: ["PrefProgress", code],
    queryFn: async() => {
      const { data } = await axios.get<StationProgress>("/api/prefProgress/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
  });
};


// 乗降/通過の情報を追加
export const useSendStationStateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(req: StationHistory) => {
      const { data } = await axios.get<string>(`/api/postStationDate?code=${req.stationCode}&state=${req.state}&date=${convert_date(req.date)}`, ngrok_header);
      return data;
    },
    onSuccess: (data: string, variables: StationHistory) => {
      queryClient.invalidateQueries({ queryKey: ["Station", variables.stationCode] });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryList"] });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryCount"] });
      queryClient.invalidateQueries({ queryKey: ["StationHistory", variables.stationCode] });
      queryClient.invalidateQueries({ queryKey: ["StationGroupHistory", variables.stationGroupCode] });
      queryClient.invalidateQueries({ queryKey: ["RailwayProgress"] });
      queryClient.invalidateQueries({ queryKey: ["CompanyProgress"] });
      queryClient.invalidateQueries({ queryKey: ["PrefProgress"] });
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

// 立ち寄りの情報を追加
export const useSendStationGroupStateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(req: StationGroupHistory) => {
      const { data } = await axios.get<string>(`/api/postStationGroupDate?code=${req.stationGroupCode}&date=${convert_date(req.date)}`, ngrok_header);
      return data;
    },
    onSuccess: (data: string, variables: StationGroupHistory) => {
      queryClient.invalidateQueries({ queryKey: ["StationGroup", variables.stationGroupCode] });
      queryClient.invalidateQueries({ queryKey: ["StationGroupHistory", variables.stationGroupCode] });
    },
    onError: (err: Error) => {
      console.error(err);
    }
  });
};


// 乗降/通過の履歴を削除
export const useDeleteStationHistoryMutation = (
  onSuccessFn?: (data: string, variables: StationHistory) => unknown
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(req: StationHistory) => {
      const { data } = await axios.get<string>(`/api/deleteStationDate?code=${req.stationCode}&state=${req.state}&date=${convert_date(req.date)}`, ngrok_header);
      return data;
    },
    onSuccess: (data: string, variables: StationHistory) => {
      queryClient.invalidateQueries({ queryKey: ["Station", variables.stationCode] });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryList"] });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryCount"] });
      queryClient.invalidateQueries({ queryKey: ["StationHistory", variables.stationCode] });
      queryClient.invalidateQueries({ queryKey: ["StationGroupHistory", variables.stationGroupCode] });
      queryClient.invalidateQueries({ queryKey: ["GroupStations", variables.stationGroupCode] });
      queryClient.invalidateQueries({ queryKey: ["RailwayProgress"] });
      queryClient.invalidateQueries({ queryKey: ["CompanyProgress"] });
      queryClient.invalidateQueries({ queryKey: ["PrefProgress"] });
      onSuccessFn && onSuccessFn(data, variables);
    },
    onError: (err: Error) => {
      console.error(err);
    }
  });
};


// 立ち寄りの履歴を削除
export const useDeleteStationGroupHistoryMutation = (
  onSuccessFn?: (data: string, variables: StationGroupHistory) => unknown
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(req: StationGroupHistory) => {
      const { data } = await axios.get<string>(`/api/deleteStationGroupState?code=${req.stationGroupCode}&date=${convert_date(req.date)}`, ngrok_header);
      return data;
    },
    onSuccess: (data: string, variables: StationGroupHistory) => {
      queryClient.invalidateQueries({ queryKey: ["StationGroup", variables.stationGroupCode] });
      queryClient.invalidateQueries({ queryKey: ["StationGroupHistory", variables.stationGroupCode] });
      onSuccessFn && onSuccessFn(data, variables);
    },
    onError: (err: Error) => {
      console.error(err);
    }
  });
};
