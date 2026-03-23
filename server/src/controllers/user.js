const bcrypt = require("bcrypt");
const { Users } = require("../components/user");
const { db, usersManager } = require("../db/connection");
const { AuthError } = require("../components/custom-errors");

// タイミング攻撃対策: ユーザー未存在時にもbcrypt比較と同等の時間を消費させるためのダミーハッシュ
const DUMMY_HASH = bcrypt.hashSync("dummy", 10);

const SESSION_COOKIE_OPTIONS = {
  maxAge: Users.expirationTime / 1000,
  httpOnly: true,
  secure: true,
  sameSite: "Lax",
  path: "/",
};

usersManager.watch();

// 新規登録
// /api/signup
exports.signup = async (request, reply) => {
  const { userName, userEmail, password } = request.body;

  const exists = db
    .prepare(
      `
    SELECT 1 FROM Users
    WHERE userEmail = ?
  `,
    )
    .get(userEmail);
  if (exists) {
    return { auth: false };
  }

  const sessionId = usersManager.signup(userName, userEmail, password);
  if (!sessionId) {
    return reply.code(500).send({ error: "Internal Server Error" });
  }
  reply.setCookie("sessionId", sessionId, SESSION_COOKIE_OPTIONS);
  return { auth: true };
};

// ログイン
// /api/login
exports.login = async (request, reply) => {
  const { userEmail, password } = request.body;

  const userData = db
    .prepare(
      `
    SELECT * FROM Users
    WHERE userEmail = ?
  `,
    )
    .get(userEmail);
  if (!userData) {
    bcrypt.compareSync(password, DUMMY_HASH);
    throw new AuthError("メールアドレスまたはパスワードが間違っています");
  }

  const sessionId = usersManager.login(userEmail, password);
  if (!sessionId) {
    throw new AuthError("メールアドレスまたはパスワードが間違っています");
  }

  reply.setCookie("sessionId", sessionId, SESSION_COOKIE_OPTIONS);
  return { auth: true };
};

// check
// /api/status
exports.status = async (request, reply) => {
  const sessionId = request.cookies.sessionId;
  if (!sessionId) {
    return { auth: false, userEmail: null, userName: null, role: null };
  }
  const userData = usersManager.status(sessionId);
  if (!userData) {
    return { auth: false, userEmail: null, userName: null, role: null };
  }
  reply.setCookie("sessionId", sessionId, SESSION_COOKIE_OPTIONS);
  return {
    auth: true,
    userEmail: userData.userEmail,
    userName: userData.userName,
    role: userData.role,
  };
};

// logout
// /api/logout
exports.logout = async (request, reply) => {
  const sessionId = request.cookies.sessionId;
  usersManager.logout(sessionId);
  reply.setCookie("sessionId", "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return reply.send("OK");
};
