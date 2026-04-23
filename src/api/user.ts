import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "./axios";
import { invalidateAllHistoryQueries } from "./queryKeys";
import { Auth, User } from "./types";

// 新規登録
export const useSignupMutation = (
  callbackFn?: (authorized: boolean) => unknown,
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
  onSuccessFn?: () => unknown,
  onErrorFn?: (message: string) => unknown,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: User) => {
      const { data } = await axios.post<Auth>("/api/login", {
        ...req,
      });
      return data;
    },
    onSuccess: () => {
      onSuccessFn && onSuccessFn();
      queryClient.invalidateQueries({ queryKey: ["UserData"] });
    },
    onError: (err) => {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "ログインに失敗しました";
      onErrorFn && onErrorFn(message);
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
      const { data } = await axios.post<string>("/api/logout");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["UserData"] });
      invalidateAllHistoryQueries(queryClient);
      onSuccessFn && onSuccessFn();
    },
    onError: (err: Error) => {
      console.error(err);
    },
  });
};
