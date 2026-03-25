import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { usersManager } from "../db/connection";
import { Users } from "../components/user";
import { AuthError, ForbiddenError } from "../shared/errors";

export default fp(async function (fastify: FastifyInstance) {
  // リクエストに userId, userRole を追加するデコレータ
  fastify.decorateRequest("userId", null);
  fastify.decorateRequest("userName", null);
  fastify.decorateRequest("userEmail", null);
  fastify.decorateRequest("userRole", null);
  fastify.decorateRequest("isAdmin", false);

  // 認証必須のルート用 onRequest フック
  fastify.decorate("authenticate", async (request: FastifyRequest) => {
    const sessionId = request.cookies.sessionId;
    if (!sessionId) {
      throw new AuthError("Unauthorized");
    }
    const userData = usersManager.status(sessionId);
    if (!userData) {
      throw new AuthError("Unauthorized");
    }
    request.userId = userData.userId;
    request.userName = userData.userName;
    request.userEmail = userData.userEmail;
    request.userRole = userData.role;
    request.isAdmin = Users.hasAdmin(userData.role);
  });

  // 管理者権限必須のルート用フック
  fastify.decorate("authenticateAdmin", async (request: FastifyRequest) => {
    await fastify.authenticate(request);
    if (!request.isAdmin) {
      throw new ForbiddenError("Forbidden");
    }
  });

  // 認証が任意のルート用（userId があればセット、なくてもエラーにしない）
  fastify.decorate("optionalAuth", async (request: FastifyRequest, _reply: FastifyReply) => {
    const sessionId = request.cookies.sessionId;
    if (!sessionId) return;
    const userData = usersManager.status(sessionId);
    if (!userData) return;
    request.userId = userData.userId;
    request.userRole = userData.role;
    request.isAdmin = Users.hasAdmin(userData.role);
  });
});
