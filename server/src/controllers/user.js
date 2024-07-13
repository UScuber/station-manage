const { db, usersManager } = require("../components/db");
const {
  AuthError,
  InputError,
  InvalidValueError,
  ServerError,
} = require("../components/custom-errors");



usersManager.watch();


// 新規登録
// /api/signup
exports.signup = (req, res) => {
  const userName = req.body.userName;
  const userEmail = req.body.userEmail;
  const password = req.body.password;

  if(!userName || !userEmail || !password){
    throw new InputError("Invalid input");
  }
  try{
    const userData = db.prepare(`
      SELECT * FROM Users
      WHERE userEmail = ?
    `).get(userEmail);
    if(userData){
      res.json({ auth: false });
      return;
    }
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  const sessionId = usersManager.signup(userName, userEmail, password);
  if(!sessionId){
    throw new ServerError("Server Error");
  }
  res.cookie("sessionId", sessionId, {
    maxAge: usersManager.expirationTime,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
  res.json({ auth: true });
};


// ログイン
// /api/login
exports.login = (req, res) => {
  const userEmail = req.body.userEmail;
  const password = req.body.password;

  if(!userEmail || !password){
    throw new InputError("Invalid input");
  }
  try{
    const userData = db.prepare(`
      SELECT * FROM Users
      WHERE userEmail = ?
    `).get(userEmail);
    if(!userData){
      throw new InvalidValueError("Invalid input");
    }
  }catch(err){
    throw new ServerError("Server Error", err);
  }
  const sessionId = usersManager.login(userEmail, password);
  if(!sessionId){
    res.json({ auth: false });
    return;
  }

  res.cookie("sessionId", sessionId, {
    maxAge: usersManager.expirationTime,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
  res.json({ auth: true });
};


// check
// /api/status
exports.status = (req, res) => {
  const userData = usersManager.getUserData(req);
  if(userData.auth){
    res.cookie("sessionId", req.cookies.sessionId, {
      maxAge: usersManager.expirationTime,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    });
  }
  res.json({
    auth: userData.auth,
    userEmail: userData.userEmail,
    userName: userData.userName,
    role: userData.role,
  });
};


// logout
// /api/logout
exports.logout = (req, res) => {
  const sessionId = req.cookies.sessionId;
  if(!sessionId){
    throw new InputError("Invalid input");
  }
  const userId = usersManager.getUserData(req).userId;
  if(!userId){
    throw new AuthError("Unauthorized");
  }
  usersManager.logout(sessionId);
  res.cookie("sessionId", "", {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
  res.end("OK");
};
