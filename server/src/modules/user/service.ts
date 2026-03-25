import bcrypt from "bcrypt";
import { db, usersManager } from "../../db/connection";
import { AuthError } from "../../shared/errors";
import type { SignupBody, LoginBody } from "./schema";

// タイミング攻撃対策: ユーザー未存在時にもbcrypt比較と同等の時間を消費させるためのダミーハッシュ
const DUMMY_HASH = bcrypt.hashSync("dummy", 10);

usersManager.watch();

export const signup = (body: SignupBody): { auth: boolean; sessionId?: string } => {
  const { userName, userEmail, password } = body;

  const exists = db
    .prepare(`SELECT 1 FROM Users WHERE userEmail = ?`)
    .get(userEmail);
  if (exists) {
    return { auth: false };
  }

  const sessionId = usersManager.signup(userName, userEmail, password);
  if (!sessionId) {
    return { auth: false };
  }
  return { auth: true, sessionId };
};

export const login = (body: LoginBody): string => {
  const { userEmail, password } = body;

  const userData = db
    .prepare(`SELECT * FROM Users WHERE userEmail = ?`)
    .get(userEmail);
  if (!userData) {
    bcrypt.compareSync(password, DUMMY_HASH);
    throw new AuthError("メールアドレスまたはパスワードが間違っています");
  }

  const sessionId = usersManager.login(userEmail, password);
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
