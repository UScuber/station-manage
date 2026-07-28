import crypto from "crypto";
import bcrypt from "bcrypt";
import { SqliteError } from "better-sqlite3";
import type { DatabaseInstance } from "../db/connection";
import type { UserData } from "../types";
import { convertDate } from "../shared/date";

export const BCRYPT_MAX_PASSWORD_BYTES = 72;

export const isPasswordWithinBcryptLimit = (password: string): boolean =>
  Buffer.byteLength(password, "utf8") <= BCRYPT_MAX_PASSWORD_BYTES;

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync("dummy", BCRYPT_ROUNDS);

export class Users {
  private db: DatabaseInstance;

  static expirationTime = 1000 * 60 * 60 * 24 * 20; // [ms] (20 days)
  static sessionCheckInterval = 1000 * 60 * 15; // [ms] (15 min.)
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

  // 新規、重複メールの場合は undefined を返す
  async signup(
    userName: string,
    userEmail: string,
    password: string,
  ): Promise<string | undefined> {
    const userId = this.genSessionId();
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const sessionId = this.genSessionId();

    try {
      this.db
        .prepare(
          `
          INSERT INTO Users(userId, userName, userEmail, role, hash)
          VALUES(?, ?, ?, ?, ?)
        `,
        )
        .run(userId, userName, userEmail, 0, hash);
    } catch (e) {
      if (e instanceof SqliteError && e.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return undefined;
      }
      throw e;
    }

    this.db
      .prepare(
        `
        INSERT INTO Sessions(userId, sessionId, updatedDate)
        VALUES(?, ?, datetime(?))
      `,
      )
      .run(userId, Users.hashSessionId(sessionId), convertDate(new Date()));

    return sessionId;
  }

  // 既存
  async login(
    userEmail: string,
    password: string,
  ): Promise<string | undefined> {
    const userData = this.db
      .prepare<[string], { userId: string; hash: string }>(
        `
        SELECT userId, hash FROM Users
        WHERE userEmail = ?
      `,
      )
      .get(userEmail);

    const hash = userData?.hash ?? DUMMY_HASH;
    const ok = await bcrypt.compare(password, hash);
    if (!ok || !userData) {
      return undefined;
    }

    const sessionId = this.genSessionId();
    this.db
      .prepare(
        `
        INSERT INTO Sessions(userId, sessionId, updatedDate)
        VALUES(?, ?, datetime(?))
      `,
      )
      .run(
        userData.userId,
        Users.hashSessionId(sessionId),
        convertDate(new Date()),
      );

    return sessionId;
  }

  // login状態を判定
  status(sessionId: string): UserData | undefined {
    const sessionHash = Users.hashSessionId(sessionId);
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
      .get(sessionHash, expireThreshold);
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
      .run(convertDate(new Date()), userData.userId, sessionHash);
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
      .run(Users.hashSessionId(sessionId));
  }

  // 一定期間が経過したsessionを消す
  watch(): void {
    setInterval(() => {
      try {
        this.db
          .prepare(
            `
          DELETE FROM Sessions
          WHERE updatedDate < datetime(?)
        `,
          )
          .run(convertDate(new Date().getTime() - Users.expirationTime));
      } catch (e) {
        console.error("[watch] session cleanup failed:", e);
      }
    }, Users.sessionCheckInterval);
  }

  genSessionId(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  // DBに保存するセッションIDはハッシュ化
  static hashSessionId(sessionId: string): string {
    return crypto.createHash("sha256").update(sessionId).digest("hex");
  }
}
