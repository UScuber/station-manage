import { db, usersManager } from "../../db/connection";
import { AuthError } from "../../shared/errors";
import type { SignupBody, LoginBody } from "./schema";

usersManager.watch();

export const signup = (body: SignupBody): { auth: false } | { auth: true; sessionId: string } => {
  const { userName, userEmail, password } = body;

  const exists = db
    .prepare(`SELECT 1 FROM Users WHERE userEmail = ?`)
    .get(userEmail);
  if (exists) {
    return { auth: false };
  }

  const sessionId = usersManager.signup(userName, userEmail, password);
  return { auth: true, sessionId };
};

export const login = (body: LoginBody): string => {
  const sessionId = usersManager.login(body.userEmail, body.password);
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
