const crypto = require("crypto");
const bcrypt = require("bcrypt");


class Users {
  constructor(db){
    this.db = db;
  }

  // 新規
  signup(userName, userEmail, password){
    const userId = this.genSessionId();
    const rounds = crypto.randomInt(6, 10);
    const hash = bcrypt.hashSync(password, rounds);
    const sessionId = this.genSessionId();

    try{
      this.db.prepare(`
        INSERT INTO Users VALUES(?,?,?,?,?)
      `).run(userId, userName, userEmail, hash, sessionId);
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
        UPDATE Users SET sessionId = ?
        WHERE userEmail = ?
      `).run(new_sessionId, userEmail);
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
      };
    }
    const userData = this.status(sessionId);
    return {
      auth: userData !== undefined,
      userId: userData?.userId,
      userName: userData?.userName,
      userEmail: userData?.userEmail,
    };
  }

  // login状態を判定
  status(sessionId){
    let userData;
    try{
      userData = this.db.prepare(`
        SELECT * FROM Users
        WHERE sessionId = ?
      `).get(sessionId);
      if(!userData){
        return undefined;
      }
    }catch(err){
      console.error(err);
      return undefined;
    }
    return userData;
  }

  logout(sessionId){
    const new_sessionId = this.genSessionId();
    try{
      this.db.prepare(`
        UPDATE Users SET sessionId = ?
        WHERE sessionId = ?
      `).run(new_sessionId, sessionId);
    }catch(err){
      console.error(err);
    }
  }

  genSessionId(){
    return (crypto.randomUUID() + crypto.randomUUID()).replaceAll("-", "");
  }
};

exports.Users = Users;
