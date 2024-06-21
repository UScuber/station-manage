import { useQuery } from "@tanstack/react-query";
import axios from "./axios";
import {
  Company,
  Coordinate,
  PathData,
  Railway,
  Station,
  StationGroup,
} from "./types";


const ngrok_header = {
  headers: { "ngrok-skip-browser-warning": "a" },
};



// 駅情報取得
export const useStationInfo = (
  code: number | undefined,
  onSuccessFn?: (data: Station) => unknown
) => {
  return useQuery<Station>({
    queryKey: ["Station", code],
    queryFn: async() => {
      const { data } = await axios.get<Station>("/api/station/" + code, ngrok_header);
      onSuccessFn && onSuccessFn(data);
      return data;
    },
    enabled: code !== undefined,
    staleTime: Infinity,
  });
};


// 駅グループに属する駅の駅情報を取得
export const useStationsInfoByGroupCode = (code: number | undefined) => {
  return useQuery<Station[]>({
    queryKey: ["GroupStations", code],
    queryFn: async() => {
      const { data } = await axios.get<Station[]>("/api/stationsByGroupCode/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
    staleTime: Infinity,
  });
};


// 駅グループの情報取得
export const useStationGroupInfo = (
  code: number | undefined,
  onSuccessFn?: (data: StationGroup) => unknown
) => {
  return useQuery<StationGroup>({
    queryKey: ["StationGroup", code],
    queryFn: async() => {
      const { data } = await axios.get<StationGroup>("/api/stationGroup/" + code, ngrok_header);
      onSuccessFn && onSuccessFn(data);
      return data;
    },
    enabled: code !== undefined,
    staleTime: Infinity,
  });
};


// 路線情報取得
export const useRailwayInfo = (code: number | undefined) => {
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
export const useRailwayList = () => {
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
) => {
  return useQuery<Station[]>({
    queryKey: ["RailwayStations", code],
    queryFn: async() => {
      const { data } = await axios.get<Station[]>("/api/railwayStations/" + code, ngrok_header);
      onSuccessFn && onSuccessFn(data);
      return data;
    },
    enabled: code !== undefined,
    staleTime: Infinity,
  });
};


// 会社情報取得
export const useCompanyInfo = (code: number | undefined) => {
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
export const useCompanyList = () => {
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
export const useRailwaysInfoByCompanyCode = (code: number | undefined) => {
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
export const useStationsInfoByCompanyCode = (code: number | undefined) => {
  return useQuery<Station[]>({
    queryKey: ["CompanyStations", code],
    queryFn: async() => {
      const { data } = await axios.get<Station[]>("/api/companyStations/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
    staleTime: Infinity,
  });
};


// 県に属する路線の路線情報を取得
export const useRailwaysInfoByPrefCode = (code: number | undefined) => {
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
export const useStationsInfoByPrefCode = (code: number | undefined) => {
  return useQuery<Station[]>({
    queryKey: ["PrefStations", code],
    queryFn: async() => {
      const { data } = await axios.get<Station[]>("/api/prefStations/" + code, ngrok_header);
      return data;
    },
    enabled: code !== undefined,
    staleTime: Infinity,
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
) => {
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
) => {
  return useQuery<number>({
    queryKey: ["StationGroupCount", name],
    queryFn: async() => {
      const { data } = await axios.get<number>(`/api/searchStationGroupCount?name=${name ?? ""}`, ngrok_header);
      return data;
    },
  });
};


// 座標から近い駅/駅グループを複数取得
export const useSearchKNearestStationGroups = (pos: Coordinate | undefined, num?: number) => {
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
export const usePrefName = (code: number | undefined) => {
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
export const usePrefList = () => {
  return useQuery<Prefecture[]>({
    queryKey: ["Prefecture"],
    queryFn: async() => {
      const { data } = await axios.get<Prefecture[]>("/api/pref", ngrok_header);
      return data;
    },
    staleTime: Infinity,
  });
};


// 路線の線路のpathを取得
export const useRailPath = (railwayCode: number | undefined) => {
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
export const useRailPathByCompanyCode = (companyCode: number | undefined) => {
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
