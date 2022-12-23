const OutboundCache = require("@cimpress-technology/ct-outbound-cache");
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
    projectCache
  });
};
