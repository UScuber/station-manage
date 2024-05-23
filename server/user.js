const crypto = require("crypto");
const bcrypt = require("bcrypt");


class Users {
  constructor(db){
    this.db = db;
  }

  // 新規
  signin(userName, userEmail, password){
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

  // login状態を判定
  status(sessionId){
    try{
      const userData = this.db.prepare(`
        SELECT * FROM Users
        WHERE sessionId = ?
      `).get(sessionId);
      if(!userData){
        return false;
      }
    }catch(err){
      console.error(err);
      return false;
    }
    return true;
  }

  logout(userId){
    const new_sessionId = this.genSessionId();
    try{
      this.db.prepare(`
        UPDATE Users SET sessionId = ?
        WHERE userId = ?
      `).run(new_sessionId, userId);
    }catch(err){
      console.error(err);
    }
  }

  genSessionId(){
    return (crypto.randomUUID() + crypto.randomUUID()).replaceAll("-", "");
  }
};

exports.Users = Users;
