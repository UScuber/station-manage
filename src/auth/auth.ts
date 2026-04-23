import { createContext, useContext, useState } from "react";
import { User } from "../api/types";
import {
  useLoginMutation,
  useLogoutMutation,
  useSignupMutation,
  useUserStatus,
} from "../api/user";

export type AuthInfo = {
  signup: (
    onSuccessFn?: (authorized: boolean) => unknown,
  ) => ReturnType<typeof useSignupMutation>;
  login: (
    onSuccessFn?: () => unknown,
    onErrorFn?: (message: string) => unknown,
  ) => ReturnType<typeof useLoginMutation>;
  logout: (onSuccessFn?: () => unknown) => ReturnType<typeof useLogoutMutation>;
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | undefined;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthInfo | null>(null);

export const useAuthState = (): AuthInfo => {
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<User>();

  useUserStatus((data) => {
    setAuthState(data.auth);
    setIsAdmin(data.isAdmin);
    if (data.userName && data.userEmail) {
      setUser({
        userName: data.userName,
        userEmail: data.userEmail,
      });
    }
    setLoading(false);
  });

  return {
    signup: useSignupMutation,
    login: useLoginMutation,
    logout: useLogoutMutation,
    isLoading: loading,
    isAuthenticated: authState,
    user: user,
    isAdmin,
  };
};

export const AuthProvider = AuthContext.Provider;

export const useAuth = (): AuthInfo => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
};
