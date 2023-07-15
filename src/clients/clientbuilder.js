// const OutboundCache = require("@cimpress-technology/ct-outbound-cache");
const asyncHandler = require("express-async-handler");
const OutboundCache = require("./outboundCache");
const GitLabClient = require("./gitlabclient");

module.exports = ({ app, config, logger }) => {
  const projectCache = new OutboundCache(
    {
      name: "projectCache",
      defaultMaxAgeInSeconds: 3600,
      caches: [
        {
          type: "memory",
          size: 300
        }
      ]
    },
    logger
  );

  app.locals.gitLabClient = new GitLabClient({
    token: config.gitlabToken,
    projectCache,
    gitlabUrl: config.gitlabUrl
  });

  app.use(
    asyncHandler(async (req, res, next) => {
      const gitProviderConfig =
        await res.locals.preferencesDAO.getGitProvider();

      if (gitProviderConfig) {
        const userProjectCache = new OutboundCache(
          {
            name: "projectCache",
            user: req.user,
            defaultMaxAgeInSeconds: 3600,
            caches: [
              {
                type: "memory",
                size: 300
              }
            ]
          },
          logger
        );
        res.locals.gitLabClient = new GitLabClient({
          token: gitProviderConfig.access_token,
          projectCache: userProjectCache,
          gitlabUrl: config.gitlabUrl
        });
      }
      next();
    })
  );
};
