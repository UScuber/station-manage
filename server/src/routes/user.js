const User = require("../controllers/user");

module.exports = async function (fastify) {
  fastify.post(
    "/signup",
    {
      config: {
        rateLimit: { max: 5, timeWindow: "1 minute" },
      },
      schema: {
        body: {
          type: "object",
          required: ["userName", "userEmail", "password"],
          properties: {
            userName: { type: "string", minLength: 1, maxLength: 64 },
            userEmail: { type: "string", format: "email", maxLength: 64 },
            password: { type: "string", minLength: 8, maxLength: 128 },
          },
        },
      },
    },
    User.signup,
  );

  fastify.post(
    "/login",
    {
      config: {
        rateLimit: { max: 10, timeWindow: "1 minute" },
      },
      schema: {
        body: {
          type: "object",
          required: ["userEmail", "password"],
          properties: {
            userEmail: { type: "string", format: "email" },
            password: { type: "string", minLength: 1 },
          },
        },
      },
    },
    User.login,
  );

  fastify.get("/status", User.status);

  fastify.post(
    "/logout",
    {
      onRequest: [fastify.authenticate],
    },
    User.logout,
  );
};
