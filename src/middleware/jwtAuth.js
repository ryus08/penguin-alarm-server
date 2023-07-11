const { expressjwt: jwt } = require("express-jwt");
const jwksClient = require("jwks-rsa");

module.exports = {
  getMiddleware: (app) => {
    const client = jwksClient({
      jwksUri: app.locals.config.authorization.jwksUri
    });
    return jwt({
      ...app.locals.config.authorization,
      secret: async (req, token) =>
        (
          await client.getSigningKey(token && token.header && token.header.kid)
        ).getPublicKey(),
      requestProperty: "user"
    });
  }
};
