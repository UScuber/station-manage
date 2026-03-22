const fp = require("fastify-plugin");
const { usersManager } = require("../db/connection");
const { Users } = require("../components/user");

module.exports = fp(async function (fastify) {
  // リクエストに userId, userRole を追加するデコレータ
  fastify.decorateRequest("userId", null);
  fastify.decorateRequest("userName", null);
  fastify.decorateRequest("userEmail", null);
  fastify.decorateRequest("userRole", null);
  fastify.decorateRequest("isAdmin", false);

  // 認証必須のルート用 onRequest フック
  fastify.decorate("authenticate", async (request, reply) => {
    const sessionId = request.cookies.sessionId;
    if (!sessionId) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    const userData = usersManager.status(sessionId);
    if (!userData) {
      return reply.code(401).send({ error: "Unauthorized" });
    }
    request.userId = userData.userId;
    request.userName = userData.userName;
    request.userEmail = userData.userEmail;
    request.userRole = userData.role;
    request.isAdmin = Users.hasAdmin(userData.role);
  });

  // 管理者権限必須のルート用フック
  fastify.decorate("authenticateAdmin", async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (reply.sent) return;
    if (!request.isAdmin) {
      return reply.code(403).send({ error: "Forbidden" });
    }
  });

  // 認証が任意のルート用（userId があればセット、なくてもエラーにしない）
  fastify.decorate("optionalAuth", async (request, reply) => {
    const sessionId = request.cookies.sessionId;
    if (!sessionId) return;
    const userData = usersManager.status(sessionId);
    if (!userData) return;
    request.userId = userData.userId;
    request.userRole = userData.role;
    request.isAdmin = Users.hasAdmin(userData.role);
  });
});
