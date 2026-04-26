import crypto from "crypto";
import bcrypt from "bcrypt";
import type { DatabaseInstance } from "../db/connection";
import type { UserData } from "../types";
import { convertDate } from "../shared/date";

export class Users {
  private db: DatabaseInstance;

  static expirationTime = 1000 * 60 * 60 * 24 * 20; // [ms] (20 days)
  static sessionCheckInterval = 1000 * 60 * 15; // [ms] (15 min.)
  private static DUMMY_HASH = bcrypt.hashSync("dummy", 10);
  static roleFlags = Object.freeze({
    none: 0,
    admin: 1,
  });

  constructor(db: DatabaseInstance) {
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
  signup(userName: string, userEmail: string, password: string): string {
    const userId = this.genSessionId();
    const BCRYPT_ROUNDS = 12;
    const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    const sessionId = this.genSessionId();

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
      .run(userId, sessionId, convertDate(new Date()));

    return sessionId;
  }

  // 既存
  login(userEmail: string, password: string): string | undefined {
    const userData = this.db
      .prepare<[string], { userId: string; hash: string }>(
        `
        SELECT userId, hash FROM Users
        WHERE userEmail = ?
      `,
      )
      .get(userEmail);

    const hash = userData?.hash ?? Users.DUMMY_HASH;
    if (!bcrypt.compareSync(password, hash) || !userData) {
      return undefined;
    }

    const sessionId = this.genSessionId();
    this.db
      .prepare(
        `
        INSERT INTO Sessions VALUES(?, ?, datetime(?))
      `,
      )
      .run(userData.userId, sessionId, convertDate(new Date()));

    return sessionId;
  }

  // login状態を判定
  status(sessionId: string): UserData | undefined {
    const expireThreshold = convertDate(
      new Date().getTime() - Users.expirationTime,
    );
    const userData = this.db
      .prepare<[string, string], UserData>(
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
            AND Sessions.updatedDate >= datetime(?)
      `,
      )
      .get(sessionId, expireThreshold);
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
      .run(convertDate(new Date()), userData.userId, sessionId);
    return userData;
  }

  logout(sessionId: string): void {
    this.db
      .prepare(
        `
        DELETE FROM Sessions
        WHERE sessionId = ?
      `,
      )
      .run(sessionId);
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
        .run(convertDate(new Date().getTime() - Users.expirationTime));
    }, Users.sessionCheckInterval);
  }

  genSessionId(): string {
    return crypto.randomBytes(32).toString("hex");
  }
}
