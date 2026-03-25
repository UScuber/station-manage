import crypto from "crypto";
import bcrypt from "bcrypt";
import type Database from "better-sqlite3";
import type { UserData } from "../types";

const date_string = (date: Date | number): string => {
  const date_options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  return new Date(date)
    .toLocaleString("ja-JP", date_options)
    .replaceAll("/", "-");
};

export class Users {
  private db: Database.Database;

  static expirationTime = 1000 * 60 * 60 * 24 * 20; // [ms] (20 days)
  static sessionCheckInterval = 1000 * 60 * 15; // [ms] (15 min.)
  static roleFlags = Object.freeze({
    none: 0,
    admin: 1,
  });

  constructor(db: Database.Database) {
    this.db = db;
  }

  // admin権限を持ってるか判定
  static hasAdmin(role: number): boolean {
    return role === this.roleFlags.admin;
  }

  hasAdmin(role: number): boolean {
    return Users.hasAdmin(role);
  }

  // 新規
  signup(userName: string, userEmail: string, password: string): string | undefined {
    const userId = this.genSessionId();
    const BCRYPT_ROUNDS = 12;
    const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    const sessionId = this.genSessionId();

    try {
      this.db
        .prepare(
          `
        INSERT INTO Users VALUES(?, ?, ?, ?, ?)
      `,
        )
        .run(userId, userName, userEmail, 0, hash);
      this.db
        .prepare(
          `
        INSERT INTO Sessions VALUES(?, ?, datetime(?))
      `,
        )
        .run(userId, sessionId, date_string(new Date()));
    } catch (err) {
      console.error(err);
      return undefined;
    }

    return sessionId;
  }

  // 既存
  login(userEmail: string, password: string): string | undefined {
    const new_sessionId = this.genSessionId();
    try {
      const userData = this.db
        .prepare<unknown[], { userId: string; hash: string }>(
          `
        SELECT * FROM Users
        WHERE userEmail = ?
      `,
        )
        .get(userEmail);
      if (!userData || !bcrypt.compareSync(password, userData.hash)) {
        return undefined; // unauthorized
      }
      this.db
        .prepare(
          `
        INSERT INTO Sessions VALUES(?, ?, datetime(?))
      `,
        )
        .run(userData.userId, new_sessionId, date_string(new Date()));
    } catch (err) {
      console.error(err);
      return undefined;
    }

    return new_sessionId;
  }

  // login状態を判定
  status(sessionId: string): UserData | undefined {
    let userData: UserData | undefined;
    try {
      userData = this.db
        .prepare<unknown[], UserData>(
          `
        SELECT
          Users.userId,
          Users.userName,
          Users.userEmail,
          Users.role
        FROM Users
        INNER JOIN Sessions
          ON Users.userId = Sessions.userId
            AND Sessions.sessionId = ?
      `,
        )
        .get(sessionId);
      if (!userData) {
        return undefined;
      }
      this.db
        .prepare(
          `
        UPDATE Sessions SET updatedDate = datetime(?)
        WHERE userId = ? AND sessionId = ?
      `,
        )
        .run(date_string(new Date()), userData.userId, sessionId);
    } catch (err) {
      console.error(err);
      return undefined;
    }
    return userData;
  }

  logout(sessionId: string): void {
    try {
      this.db
        .prepare(
          `
        DELETE FROM Sessions
        WHERE sessionId = ?
      `,
        )
        .run(sessionId);
    } catch (err) {
      console.error(err);
    }
  }

  // 一定期間が経過したsessionを消す
  watch(): void {
    setInterval(() => {
      this.db
        .prepare(
          `
        DELETE FROM Sessions
        WHERE updatedDate < datetime(?)
      `,
        )
        .run(date_string(new Date().getTime() - Users.expirationTime));
    }, Users.sessionCheckInterval);
  }

  genSessionId(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}
