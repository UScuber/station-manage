import { createContext, useContext, useState } from "react";
import {
  Auth,
  User,
  useLoginMutation,
  useLogoutMutation,
  useSignupMutation,
  useUserStatus,
} from "../Api";
import { UseMutationResult } from "@tanstack/react-query";


export type AuthInfo = {
  signup: (onSuccessFn?: (authorized: boolean) => unknown) => any,
  login: (onSuccessFn?: (authorized: boolean) => unknown) => UseMutationResult<Auth, Error, User, unknown>,
  logout: (onSuccessFn?: () => unknown) => UseMutationResult<string, Error, User, unknown>,
  isLoading: boolean,
  isAuthenticated: boolean,
  user: User | undefined,
};

const AuthContext = createContext<AuthInfo>({
  signup: useSignupMutation,
  login: useLoginMutation,
  logout: useLogoutMutation,
  isLoading: true,
  isAuthenticated: false,
  user: undefined,
});


export const getAuth = (): AuthInfo => {
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState(false);
  const [user, setUser] = useState<User>();

  const userStatus = useUserStatus(
    (data) => {
      setAuthState(data.auth);
      if(data.userName && data.userEmail){
        setUser({
          userName: data.userName,
          userEmail: data.userEmail,
        });
      }
      setLoading(false);
    }
  );

  return {
    signup: useSignupMutation,
    login: useLoginMutation,
    logout: useLogoutMutation,
    isLoading: loading,
    isAuthenticated: authState,
    user: user,
  };
};

export const AuthProvider = AuthContext.Provider;

export const useAuth = () => useContext(AuthContext);
