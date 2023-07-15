const { unless } = require("express-unless");
const asyncHandler = require("express-async-handler");
// const configs = require("../data/configs");

class Forbidden extends Error {
  constructor() {
    super();
    this.name = "Forbidden";
  }
}
module.exports = {
  getMiddleware: (app) => {
    let middleware;
    if (app.locals.config.authorization.requiredClaims) {
      middleware = (req, _res, next) => {
        if (
          !app.locals.config.authorization.requiredClaims.some(
            (x) => req.user[x]
          )
        ) {
          throw new Forbidden(
            `User needs one claim of ${app.locals.config.authorization.requiredClaims.join(
              ", "
            )}`
          );
        }
        req.user.groups_guest = ["*"];
        req.user.groups_maintainer = ["*"];
        next();
      };
    } else {
      middleware = asyncHandler(async (req, res, next) => {
        req.user.groups_guest = [];
        req.user.groups_maintainer = [];
        if (res.locals.gitlabClient) {
          try {
            req.user.groups_guest = (
              await res.locals.gitlabClient.groupSearch({
                min_access_level: 10
              })
            ).map((x) => x.id.toString());
            req.user.groups_maintainer = (
              await res.locals.gitlabClient.groupSearch({
                min_access_level: 40
              })
            ).map((x) => x.id.toString());
          } catch (e) {
            app.locals.logger.info(
              "User's git provider registration no longer allows access. Defaulting to the user having no access to any groups, but still access to routes that aren't provider-specific."
            );
          }
        }
        next();
      });
    }
    middleware.unless = unless;
    return middleware;
  }
};
