import { FastifyInstance } from "fastify";
import { Users } from "../../auth/users";
import { SignupBody, LoginBody } from "./schema";
import * as userService from "./service";
import type { CookieSerializeOptions } from "@fastify/cookie";

const SESSION_COOKIE_OPTIONS: CookieSerializeOptions = {
  maxAge: Users.expirationTime / 1000,
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
};

export default async function (fastify: FastifyInstance) {
  fastify.post<{ Body: SignupBody }>("/signup", {
    config: {
      rateLimit: { max: 5, timeWindow: "1 minute" },
    },
    schema: { body: SignupBody },
  }, async (request, reply) => {
    const result = await userService.signup(request.body);
    if (!result.auth) {
      return { auth: false };
    }
    reply.setCookie("sessionId", result.sessionId, SESSION_COOKIE_OPTIONS);
    return { auth: true };
  });

  fastify.post<{ Body: LoginBody }>("/login", {
    config: {
      rateLimit: { max: 10, timeWindow: "1 minute" },
    },
    schema: { body: LoginBody },
  }, async (request, reply) => {
    const sessionId = await userService.login(request.body);
    reply.setCookie("sessionId", sessionId, SESSION_COOKIE_OPTIONS);
    return { auth: true };
  });

  fastify.get("/status", async (request, reply) => {
    const userData = userService.status(request.cookies.sessionId);
    if (!userData) {
      return { auth: false, userEmail: null, userName: null, isAdmin: false };
    }
    reply.setCookie("sessionId", request.cookies.sessionId!, SESSION_COOKIE_OPTIONS);
    return {
      auth: true,
      userEmail: userData.userEmail,
      userName: userData.userName,
      isAdmin: Users.hasAdmin(userData.role),
    };
  });

  fastify.post("/logout", {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    userService.logout(request.cookies.sessionId);
    reply.setCookie("sessionId", "", { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
    return reply.send("OK");
  });
}
