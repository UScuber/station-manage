import { useQuery, useMutation, useQueryClient, QueryClient } from "@tanstack/react-query";
import axios from "./axios";
import { Auth, User } from "./types";


const ngrok_header = {
  headers: { "ngrok-skip-browser-warning": "a" },
};


// 履歴関連のデータのキャッシュを全削除
const deleteAllHistoryCache = (queryClient: QueryClient) => {
  const cahceList = [
    "LatestStationHistory",
    "LatestStationHistoryList",
    "LatestStationGroupHistory",
    "StationHistoryList",
    "StationHistoryCount",
    "StationHistoryDetail",
    "StationHistory",
    "StationGroupHistory",
    "LatestStationGroupHistoryList",
    "RailwayProgress",
    "RailwayProgressList",
    "RailwayProgressListByPref",
    "RailwayProgressListAll",
    "CompanyProgress",
    "CompanyProgressList",
    "PrefProgress",
    "PrefProgressList",
  ];
  for(const name in cahceList){
    queryClient.invalidateQueries({ queryKey: [name] });
  }
};



// 新規登録
export const useSignupMutation = (
  callbackFn?: (authorized: boolean) => unknown
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(req: User) => {
      const { data } = await axios.post<Auth>("/api/signup", {
        headers: ngrok_header.headers,
        ...req,
      });
      return data;
    },
    onSuccess: (data: Auth, variables: User) => {
      callbackFn && callbackFn(data.auth);
      queryClient.invalidateQueries({ queryKey: ["UserData"] });
    },
    onError: (err: Error) => {
      callbackFn && callbackFn(false);
      console.error(err);
    },
  });
};


// ログイン
export const useLoginMutation = (
  onSuccessFn?: (authorized: boolean) => unknown
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async(req: User) => {
      const { data } = await axios.post<Auth>("/api/login", {
        headers: ngrok_header.headers,
        ...req,
      });
      return data;
    },
    onSuccess: (data: Auth, variables: User) => {
      onSuccessFn && onSuccessFn(data.auth);
      queryClient.invalidateQueries({ queryKey: ["UserData"] });
    },
    onError: (err: Error) => {
      console.error(err);
    },
  });
};


// check status
export const useUserStatus = (
  onSuccessFn?: (data: Auth) => unknown
) => {
  return useQuery<Auth>({
    queryKey: ["UserData"],
    queryFn: async() => {
      const { data } = await axios.get<Auth>("/api/status", ngrok_header);
      onSuccessFn && onSuccessFn(data);
      return data;
    },
  });
};


// logout
export const useLogoutMutation = (
  onSuccessFn?: () => unknown
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async() => {
      const { data } = await axios.get<string>("/api/logout", ngrok_header);
      return data;
    },
    onSuccess: (data: string, variables: User) => {
      onSuccessFn && onSuccessFn();
      queryClient.invalidateQueries({ queryKey: ["UserData"] });
      deleteAllHistoryCache(queryClient);
    },
    onError: (err: Error) => {
      console.error(err);
    },
  });
};
