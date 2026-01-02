import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "./axios";
import { useAuth } from "../auth";
import {
  ExportHistoryJSON,
  StationDate,
  StationGroupDate,
  StationGroupHistory,
  StationHistory,
  StationHistoryData,
  StationHistoryDetail,
  StationProgress,
} from "./types";

const convert_date = (date: Date) => {
  return new Date(date)
    .toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replaceAll("/", "-");
};

// 駅の最新のアクセス日時を取得
export const useLatestStationHistory = (
  code: number | undefined,
  onSuccessFn?: (data: StationDate) => unknown
) => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationDate>({
    queryKey: ["LatestStationHistory", code],
    queryFn: async () => {
      const { data } = await axios.get<StationDate>(
        "/api/latestStationHistory/" + code
      );
      onSuccessFn && onSuccessFn(data);
      return data;
    },
    enabled: isAuthenticated && code !== undefined,
  });
};

// 路線に属する駅の最新のアクセス日時を取得
export const useLatestStationHistoryListByRailwayCode = (
  code: number | undefined
) => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationDate[]>({
    queryKey: ["LatestStationHistoryList", code],
    queryFn: async () => {
      const { data } = await axios.get<StationDate[]>(
        "/api/latestRailwayStationHistory/" + code
      );
      return data;
    },
    enabled: isAuthenticated && code !== undefined,
  });
};

// 駅グループの最新のアクセス日時を取得
export const useLatestStationGroupHistory = (
  code: number | undefined,
  onSuccessFn?: (data: StationGroupDate) => unknown
) => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationGroupDate>({
    queryKey: ["LatestStationGroupHistory", code],
    queryFn: async () => {
      const { data } = await axios.get<StationGroupDate>(
        "/api/latestStationGroupHistory/" + code
      );
      onSuccessFn && onSuccessFn(data);
      return data;
    },
    enabled: isAuthenticated && code !== undefined,
  });
};

// 乗降/通過の履歴を区間取得
export const useStationHistoryList = (
  offset: number,
  length: number,
  name?: string,
  type?: string,
  dateFrom?: Date | null,
  dateTo?: Date | null
) => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationHistoryDetail[]>({
    queryKey: [
      "StationHistoryList",
      offset,
      length,
      name,
      type,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      const { data } = await axios.get<StationHistoryDetail[]>(
        "/api/stationHistory",
        {
          params: {
            off: offset,
            len: length,
            name: name,
            type: type,
            dateFrom: dateFrom ? convert_date(dateFrom) : undefined,
            dateTo: dateTo ? convert_date(dateTo) : undefined,
          },
        }
      );
      return data;
    },
    enabled: isAuthenticated,
  });
};

// 乗降/通過の履歴の個数を取得
export const useStationHistoryCount = (
  name?: string,
  type?: string,
  dateFrom?: Date | null,
  dateTo?: Date | null
) => {
  const { isAuthenticated } = useAuth();
  return useQuery<number>({
    queryKey: ["StationHistoryCount", name, type, dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await axios.get<number>("/api/stationHistoryCount", {
        params: {
          name: name,
          type: type,
          dateFrom: dateFrom ? convert_date(dateFrom) : undefined,
          dateTo: dateTo ? convert_date(dateTo) : undefined,
        },
      });
      return data;
    },
    enabled: isAuthenticated,
  });
};

// 駅情報を付与した履歴を取得
export const useStationHistoryListAndInfo = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationHistoryDetail[]>({
    queryKey: ["StationHistoryDetail"],
    queryFn: async () => {
      const { data } = await axios.get<StationHistoryDetail[]>(
        "/api/stationHistoryAndInfo"
      );
      return data;
    },
    enabled: isAuthenticated,
  });
};

// 駅の履歴を取得
export const useStationAllHistory = (
  code: number | undefined,
  onSuccessFn?: (data: StationHistory[]) => unknown
) => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationHistory[]>({
    queryKey: ["StationHistory", code],
    queryFn: async () => {
      const { data } = await axios.get<StationHistory[]>(
        "/api/stationHistory/" + code
      );
      onSuccessFn && onSuccessFn(data);
      return data;
    },
    enabled: isAuthenticated && code !== undefined,
  });
};

// 駅グループ全体の履歴を取得(各駅の行動も含める)
export const useStationGroupAllHistory = (
  code: number | undefined,
  onSuccessFn?: (data: StationHistoryData[]) => unknown
) => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationHistoryData[]>({
    queryKey: ["StationGroupHistory", code],
    queryFn: async () => {
      const { data } = await axios.get<StationHistoryData[]>(
        "/api/stationGroupHistory/" + code
      );
      onSuccessFn && onSuccessFn(data);
      return data;
    },
    enabled: isAuthenticated && code !== undefined,
  });
};

// 駅グループを名前で検索、区間指定した時のグループの最新の履歴
export const useSearchStationGroupListHistory = ({
  offset,
  length,
  name,
}: {
  offset: number;
  length: number;
  name: string | undefined;
}) => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationGroupDate[]>({
    queryKey: ["LatestStationGroupHistoryList", offset, length, name],
    queryFn: async () => {
      const { data } = await axios.get<StationGroupDate[]>(
        "/api/searchStationGroupListHistory",
        {
          params: {
            off: offset,
            len: length,
            name: name,
          },
        }
      );
      return data;
    },
    enabled: isAuthenticated,
  });
};

// 路線の駅の個数と乗降/通過した駅の個数を取得
export const useRailwayProgress = (code: number | undefined) => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationProgress>({
    queryKey: ["RailwayProgress", code],
    queryFn: async () => {
      const { data } = await axios.get<StationProgress>(
        "/api/railwayProgress/" + code
      );
      return data;
    },
    enabled: isAuthenticated && code !== undefined,
  });
};

// 会社の各路線の駅の個数と乗降/通過した駅の個数を取得
export const useRailwayProgressListByCompanyCode = (
  code: number | undefined
) => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationProgress[]>({
    queryKey: ["RailwayProgressList", code],
    queryFn: async () => {
      const { data } = await axios.get<StationProgress[]>(
        "/api/railwayProgressList/" + code
      );
      return data;
    },
    enabled: isAuthenticated && code !== undefined,
  });
};

// 指定された都道府県に駅がが存在する路線の駅の個数と乗降/通過した駅の個数を取得
export const useRailwayProgressListByPrefCode = (code: number | undefined) => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationProgress[]>({
    queryKey: ["RailwayProgressListByPref", code],
    queryFn: async () => {
      const { data } = await axios.get<StationProgress[]>(
        "/api/prefRailwayProgressList/" + code
      );
      return data;
    },
    enabled: isAuthenticated && code !== undefined,
  });
};

// 全会社の各路線の駅の個数と乗降/通過した駅の個数のリストを取得
export const useRailwayProgressList = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationProgress[]>({
    queryKey: ["RailwayProgressListAll"],
    queryFn: async () => {
      const { data } = await axios.get<StationProgress[]>(
        "/api/railwayProgressList"
      );
      return data;
    },
    enabled: isAuthenticated,
  });
};

// 会社の駅の個数と乗降/通過した駅の個数を取得
export const useCompanyProgress = (code: number | undefined) => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationProgress>({
    queryKey: ["CompanyProgress", code],
    queryFn: async () => {
      const { data } = await axios.get<StationProgress>(
        "/api/companyProgress/" + code
      );
      return data;
    },
    enabled: isAuthenticated && code !== undefined,
  });
};

// 全会社の駅の個数と乗降/通過した駅の個数のリストを取得
export const useCompanyProgressList = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationProgress[]>({
    queryKey: ["CompanyProgressList"],
    queryFn: async () => {
      const { data } = await axios.get<StationProgress[]>(
        "/api/companyProgress"
      );
      return data;
    },
    enabled: isAuthenticated,
  });
};

// 都道府県の駅の個数と乗降/通過した駅の個数を取得(駅グループを1つとはしない)
export const usePrefProgress = (code: number | undefined) => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationProgress>({
    queryKey: ["PrefProgress", code],
    queryFn: async () => {
      const { data } = await axios.get<StationProgress>(
        "/api/prefProgress/" + code
      );
      return data;
    },
    enabled: isAuthenticated && code !== undefined,
  });
};

// 全国の駅の個数と乗降/通過した駅の個数を取得(駅グループを1つとはしない)
export const usePrefProgressList = () => {
  const { isAuthenticated } = useAuth();
  return useQuery<StationProgress[]>({
    queryKey: ["PrefProgressList"],
    queryFn: async () => {
      const { data } = await axios.get<StationProgress[]>("/api/prefProgress");
      return data;
    },
    enabled: isAuthenticated,
  });
};

// 乗降/通過の情報を追加
export const useSendStationStateMutation = (
  onErrorFn?: (err: Error, variables: StationHistory) => any
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: StationHistory) => {
      const { data } = await axios.get<string>("/api/postStationDate", {
        params: {
          code: req.stationCode,
          state: req.state,
          date: convert_date(req.date),
        },
      });
      return data;
    },
    onSuccess: (data: string, variables: StationHistory) => {
      queryClient.invalidateQueries({
        queryKey: ["LatestStationHistory", variables.stationCode],
      });
      queryClient.invalidateQueries({ queryKey: ["LatestStationHistoryList"] });
      queryClient.invalidateQueries({
        queryKey: ["LatestStationGroupHistory", variables.stationGroupCode],
      });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryList"] });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryCount"] });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryDetail"] });
      queryClient.invalidateQueries({
        queryKey: ["StationHistory", variables.stationCode],
      });
      queryClient.invalidateQueries({
        queryKey: ["StationGroupHistory", variables.stationGroupCode],
      });
      queryClient.invalidateQueries({
        queryKey: ["LatestStationGroupHistoryList"],
      });
      queryClient.invalidateQueries({ queryKey: ["RailwayProgress"] });
      queryClient.invalidateQueries({ queryKey: ["RailwayProgressList"] });
      queryClient.invalidateQueries({
        queryKey: ["RailwayProgressListByPref"],
      });
      queryClient.invalidateQueries({ queryKey: ["RailwayProgressListAll"] });
      queryClient.invalidateQueries({ queryKey: ["CompanyProgress"] });
      queryClient.invalidateQueries({ queryKey: ["CompanyProgressList"] });
      queryClient.invalidateQueries({ queryKey: ["PrefProgress"] });
      queryClient.invalidateQueries({ queryKey: ["PrefProgressList"] });
    },
    onError: (err: Error, variables: StationHistory) => {
      onErrorFn && onErrorFn(err, variables);
      console.error(err);
    },
  });
};

// 立ち寄りの情報を追加
export const useSendStationGroupStateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: StationGroupHistory) => {
      const { data } = await axios.get<string>("/api/postStationGroupDate", {
        params: {
          code: req.stationGroupCode,
          date: convert_date(req.date),
        },
      });
      return data;
    },
    onSuccess: (data: string, variables: StationGroupHistory) => {
      queryClient.invalidateQueries({
        queryKey: ["LatestStationGroupHistory", variables.stationGroupCode],
      });
      queryClient.invalidateQueries({
        queryKey: ["StationGroupHistory", variables.stationGroupCode],
      });
      queryClient.invalidateQueries({
        queryKey: ["LatestStationGroupHistoryList"],
      });
    },
    onError: (err: Error) => {
      console.error(err);
    },
  });
};

// 乗降/通過の履歴を削除
export const useDeleteStationHistoryMutation = (
  onSuccessFn?: (data: string, variables: StationHistory) => unknown
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: StationHistory) => {
      const { data } = await axios.get<string>("/api/deleteStationDate", {
        params: {
          code: req.stationCode,
          state: req.state,
          date: convert_date(req.date),
        },
      });
      return data;
    },
    onSuccess: (data: string, variables: StationHistory) => {
      queryClient.invalidateQueries({
        queryKey: ["LatestStationHistory", variables.stationCode],
      });
      queryClient.invalidateQueries({ queryKey: ["LatestStationHistoryList"] });
      queryClient.invalidateQueries({
        queryKey: ["LatestStationGroupHistory", variables.stationGroupCode],
      });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryList"] });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryCount"] });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryDetail"] });
      queryClient.invalidateQueries({
        queryKey: ["StationHistory", variables.stationCode],
      });
      queryClient.invalidateQueries({
        queryKey: ["StationGroupHistory", variables.stationGroupCode],
      });
      queryClient.invalidateQueries({
        queryKey: ["LatestStationGroupHistoryList"],
      });
      queryClient.invalidateQueries({ queryKey: ["RailwayProgress"] });
      queryClient.invalidateQueries({ queryKey: ["RailwayProgressList"] });
      queryClient.invalidateQueries({
        queryKey: ["RailwayProgressListByPref"],
      });
      queryClient.invalidateQueries({ queryKey: ["RailwayProgressListAll"] });
      queryClient.invalidateQueries({ queryKey: ["CompanyProgress"] });
      queryClient.invalidateQueries({ queryKey: ["CompanyProgressList"] });
      queryClient.invalidateQueries({ queryKey: ["PrefProgress"] });
      queryClient.invalidateQueries({ queryKey: ["PrefProgressList"] });
      onSuccessFn && onSuccessFn(data, variables);
    },
    onError: (err: Error) => {
      console.error(err);
    },
  });
};

// 立ち寄りの履歴を削除
export const useDeleteStationGroupHistoryMutation = (
  onSuccessFn?: (data: string, variables: StationGroupHistory) => unknown
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: StationGroupHistory) => {
      const { data } = await axios.get<string>("/api/deleteStationGroupState", {
        params: {
          code: req.stationGroupCode,
          date: convert_date(req.date),
        },
      });
      return data;
    },
    onSuccess: (data: string, variables: StationGroupHistory) => {
      queryClient.invalidateQueries({
        queryKey: ["LatestStationGroupHistory", variables.stationGroupCode],
      });
      queryClient.invalidateQueries({
        queryKey: ["StationGroupHistory", variables.stationGroupCode],
      });
      queryClient.invalidateQueries({
        queryKey: ["LatestStationGroupHistoryList"],
      });
      onSuccessFn && onSuccessFn(data, variables);
    },
    onError: (err: Error) => {
      console.error(err);
    },
  });
};

// 履歴のエクスポート
export const useExportHistoryMutation = (
  onSuccessFn?: (data: string) => unknown
) => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await axios.post<ExportHistoryJSON>(
        "/api/exportHistory"
      );
      return JSON.stringify(data);
    },
    onSuccess: (data: string) => {
      onSuccessFn && onSuccessFn(data);
    },
    onError: (err: Error) => {
      console.error(err);
    },
  });
};

// 履歴のインポート
export const useImportHistoryMutation = (
  onSuccessFn?: (data: string) => unknown
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: ExportHistoryJSON) => {
      const { data } = await axios.post<string>("/api/importHistory", {
        ...req,
      });
      return data;
    },
    onSuccess: (data: string) => {
      // 履歴関連のキャッシュを全削除
      queryClient.invalidateQueries({ queryKey: ["LatestStationHistory"] });
      queryClient.invalidateQueries({ queryKey: ["LatestStationHistoryList"] });
      queryClient.invalidateQueries({
        queryKey: ["LatestStationGroupHistory"],
      });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryList"] });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryCount"] });
      queryClient.invalidateQueries({ queryKey: ["StationHistoryDetail"] });
      queryClient.invalidateQueries({ queryKey: ["StationHistory"] });
      queryClient.invalidateQueries({ queryKey: ["StationGroupHistory"] });
      queryClient.invalidateQueries({
        queryKey: ["LatestStationGroupHistoryList"],
      });
      queryClient.invalidateQueries({ queryKey: ["RailwayProgress"] });
      queryClient.invalidateQueries({ queryKey: ["RailwayProgressList"] });
      queryClient.invalidateQueries({
        queryKey: ["RailwayProgressListByPref"],
      });
      queryClient.invalidateQueries({ queryKey: ["RailwayProgressListAll"] });
      queryClient.invalidateQueries({ queryKey: ["CompanyProgress"] });
      queryClient.invalidateQueries({ queryKey: ["CompanyProgressList"] });
      queryClient.invalidateQueries({ queryKey: ["PrefProgress"] });
      queryClient.invalidateQueries({ queryKey: ["PrefProgressList"] });
      onSuccessFn && onSuccessFn(data);
    },
    onError: (err: Error) => {
      console.error(err);
    },
  });
};
