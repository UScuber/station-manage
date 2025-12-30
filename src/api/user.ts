import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "./axios";
import { Auth, User } from "./types";

// 新規登録
export const useSignupMutation = (
  callbackFn?: (authorized: boolean) => unknown
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: User) => {
      const { data } = await axios.post<Auth>("/api/signup", {
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
    mutationFn: async (req: User) => {
      const { data } = await axios.post<Auth>("/api/login", {
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
export const useUserStatus = (onSuccessFn?: (data: Auth) => unknown) => {
  return useQuery<Auth>({
    queryKey: ["UserData"],
    queryFn: async () => {
      const { data } = await axios.get<Auth>("/api/status");
      onSuccessFn && onSuccessFn(data);
      return data;
    },
  });
};

// logout
export const useLogoutMutation = (onSuccessFn?: () => unknown) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await axios.get<string>("/api/logout");
      return data;
    },
    onSuccess: (data: string, variables: User) => {
      queryClient.invalidateQueries({ queryKey: ["UserData"] });
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
      onSuccessFn && onSuccessFn();
    },
    onError: (err: Error) => {
      console.error(err);
    },
  });
};
