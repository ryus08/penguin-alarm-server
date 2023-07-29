const { unless } = require("express-unless");
const asyncHandler = require("express-async-handler");
const configs = require("../data/configs");

const ALL_GROUPS = "*";

class Forbidden extends Error {
  constructor() {
    super();
    this.name = "Forbidden";
  }
}
const userCanAccessConfig = (req, config, asMaintainer = false) => {
  const userGroups = asMaintainer
    ? req.user.groups_maintainer
    : req.user.groups_guest;

  return (
    userGroups.includes(ALL_GROUPS) ||
    config.gitlab.groupIds.every((groupId) => userGroups.includes(groupId))
  );
};

module.exports = {
  userCanAccessConfig,
  ensureAdmin: () => {
    return (req, _res, next) => {
      if (!req.user.groups_maintainer.includes(ALL_GROUPS)) {
        throw new Forbidden(
          `Only apps configured to designate admin users can use this route right now`
        );
      }
      return next();
    };
  },
  ensureUserCanAccessConfig: (asMaintainer = false) => {
    return (req, _res, next) => {
      const config = configs.get({ name: req.params.configName });
      if (
        (config && !userCanAccessConfig(req, config, asMaintainer)) ||
        // Consider both the current state and the potentially new state
        (req.body &&
          req.body.gitlab &&
          req.body.gitlab.groupIds &&
          !userCanAccessConfig(req, req.body, asMaintainer))
      ) {
        throw new Forbidden(
          `User needs ${
            asMaintainer ? "maintainer" : "guest"
          } access to all groups in config ${req.params.configName}`
        );
      }
      return next();
    };
  },
  getMiddleware: (app) => {
    let middleware;
    if (app.locals.config.authorization.requiredClaims) {
      middleware = (req, res, next) => {
        if (
          !Object.keys(app.locals.config.authorization.requiredClaims).every(
            (requiredClaim) => {
              const claimValues = app.locals.config.authorization.requiredClaim;
              if (!claimValues || !claimValues.length) {
                return (
                  req.user[requiredClaim] !== undefined &&
                  req.user[requiredClaim] !== null
                );
              }
              return claimValues.some(
                (claimValue) => req.user[requiredClaim] === claimValue
              );
            }
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
        res.locals.gitLabClient = app.locals.gitlabClient;
        next();
      };
    } else {
      middleware = asyncHandler(async (req, res, next) => {
        req.user.groups_guest = [];
        req.user.groups_maintainer = [];
        if (res.locals.gitLabClient) {
          try {
            req.user.groups_guest = (
              await res.locals.gitLabClient.groupSearch({
                min_access_level: 10
              })
            ).map((x) => x.id);
            req.user.groups_maintainer = (
              await res.locals.gitLabClient.groupSearch({
                min_access_level: 40
              })
            ).map((x) => x.id);
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
