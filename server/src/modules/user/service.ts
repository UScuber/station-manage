import { usersManager } from "../../db/connection";
import { AuthError, InvalidValueError } from "../../shared/errors";
import { isPasswordWithinBcryptLimit } from "../../auth/users";
import type { SignupBody, LoginBody } from "./schema";

usersManager.watch();

export const signup = async (
  body: SignupBody,
): Promise<{ auth: false } | { auth: true; sessionId: string }> => {
  const { userName, userEmail, password } = body;

  if (!isPasswordWithinBcryptLimit(password)) {
    throw new InvalidValueError("パスワードが長すぎます");
  }

  const sessionId = await usersManager.signup(userName, userEmail, password);
  if (!sessionId) {
    return { auth: false };
  }
  return { auth: true, sessionId };
};

export const login = async (body: LoginBody): Promise<string> => {
  const sessionId = await usersManager.login(body.userEmail, body.password);
  if (!sessionId) {
    throw new AuthError("メールアドレスまたはパスワードが間違っています");
  }
  return sessionId;
};

export const status = (sessionId: string | undefined) => {
  if (!sessionId) {
    return null;
  }
  return usersManager.status(sessionId) ?? null;
};

export const logout = (sessionId: string | undefined): void => {
  if (sessionId) {
    usersManager.logout(sessionId);
  }
};
