const crypto = require("crypto");
const bcrypt = require("bcrypt");

const date_string = (date) => {
  const date_options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return new Date(date).toLocaleString("ja-JP", date_options).replaceAll("/", "-");
};

class Users {
  constructor(db){
    this.db = db;
  }

  static {
    this.expirationTime = 1000*60*60*24 * 20; // [ms] (20 days)
    this.sessionCheckInterval = 1000*60*15; // [ms] (15 min.)
    // role
    this.roleFlags = Object.freeze({
      none: 0,
      admin: 1,
    });
  }

  // admin権限を持ってるか判定
  static hasAdmin(role){
    return role === this.roleFlags.admin;
  }

  hasAdmin(role){
    return this.hasAdmin(role);
  }

  // 新規
  signup(userName, userEmail, password){
    const userId = this.genSessionId();
    const rounds = crypto.randomInt(6, 10);
    const hash = bcrypt.hashSync(password, rounds);
    const sessionId = this.genSessionId();

    try{
      this.db.prepare(`
        INSERT INTO Users VALUES(?, ?, ?, ?, ?)
      `).run(userId, userName, userEmail, 0, hash);
      this.db.prepare(`
        INSERT INTO Sessions VALUES(?, ?, datetime(?))
      `).run(userId, sessionId, date_string(new Date()));
    }catch(err){
      console.error(err);
      return undefined;
    }

    return sessionId;
  }

  // 既存
  login(userEmail, password){
    const new_sessionId = this.genSessionId();
    try{
      const userData = this.db.prepare(`
        SELECT * FROM Users
        WHERE userEmail = ?
      `).get(userEmail);
      if(!bcrypt.compareSync(password, userData.hash)){
        return undefined; // unauthorized
      }
      this.db.prepare(`
        INSERT INTO Sessions VALUES(?, ?, datetime(?))
      `).run(userData.userId, new_sessionId, date_string(new Date()));
    }catch(err){
      console.error(err);
      return undefined;
    }

    return new_sessionId;
  }

  // user情報をcookieから
  getUserData(req){
    const sessionId = req.cookies.sessionId;
    if(!sessionId){
      return {
        auth: false,
        userId: undefined,
        userName: undefined,
        userEmail: undefined,
        role: undefined,
      };
    }
    const userData = this.status(sessionId);
    return {
      auth: userData !== undefined,
      userId: userData?.userId,
      userName: userData?.userName,
      userEmail: userData?.userEmail,
      role: userData?.role,
    };
  }

  // login状態を判定
  status(sessionId){
    let userData;
    try{
      userData = this.db.prepare(`
        SELECT
          Users.userId,
          Users.userName,
          Users.userEmail,
          Users.role
        FROM Users
        INNER JOIN Sessions
          ON Users.userId = Sessions.userId
            AND Sessions.sessionId = ?
      `).get(sessionId);
      if(!userData){
        return undefined;
      }
      this.db.prepare(`
        UPDATE Sessions SET updatedDate = datetime(?)
        WHERE userId = ? AND sessionId = ?
      `).run(date_string(new Date()), userData.userId, sessionId);
    }catch(err){
      console.error(err);
      return undefined;
    }
    return userData;
  }

  logout(sessionId){
    try{
      this.db.prepare(`
        DELETE FROM Sessions
        WHERE sessionId = ?
      `).run(sessionId);
    }catch(err){
      console.error(err);
    }
  }

  // 一定期間が経過したsessionを消す
  watch(){
    setInterval(() => {
      this.db.prepare(`
        DELETE FROM Sessions
        WHERE updatedDate < datetime(?)
      `).run(date_string(new Date().getTime() - this.expirationTime));
    }, this.sessionCheckInterval);
  }

  genSessionId(){
    return (crypto.randomUUID() + crypto.randomUUID()).replaceAll("-", "");
  }
};

exports.Users = Users;
