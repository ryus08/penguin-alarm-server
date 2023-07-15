// Belt will search and load all javasript files in the routes directory passing
// in the express app, the user provided config file and a logger instance.
const _get = require("lodash.get");
const mergeQuery = require("../reducers/mergequery");
const activityQuery = require("../reducers/activityquery");
const deploymentQuery = require("../reducers/deploymentquery");
const deploymentHistory = require("../reducers/deploymenthistory");
const achievements = require("../reducers/achievements");
const trends = require("../reducers/trends");
const projectEffort = require("../reducers/projecteffort");
const userMergeQuery = require("../reducers/usermergequery");
const { ensureUserCanAccessConfig } = require("../middleware/authorization");

const service = ({ app }) => {
  app.get("/:configName/merges", ensureUserCanAccessConfig(), (req, res) => {
    const merges = res.locals.getMerges();
    const config = res.locals.getTeamConfig();
    const includeWorkInProgress = _get(
      config,
      "gitlab.includeWorkInProgressMergeRequests",
      false
    );
    res.status(200).json(mergeQuery({ merges, includeWorkInProgress }));
  });

  app.get(
    "/:configName/merges/users/:gitlabUsername",
    ensureUserCanAccessConfig(),
    (req, res) => {
      const merges = res.locals.getMerges();
      const config = res.locals.getTeamConfig();
      const includeWorkInProgress = _get(
        config,
        "gitlab.includeWorkInProgressMergeRequests"
      );

      res.status(200).json(
        userMergeQuery({
          merges,
          username: req.params.gitlabUsername,
          includeWorkInProgress
        })
      );
    }
  );

  app.get(
    "/:configName/deploymenthistory",
    ensureUserCanAccessConfig(),
    (req, res) => {
      const deployments = res.locals.getDeployments();
      res.status(200).json(deploymentHistory({ deployments }));
    }
  );

  app.get(
    "/:configName/activity/comments",
    ensureUserCanAccessConfig(),
    (req, res) => {
      const merges = res.locals.getMerges();
      res.status(200).json(activityQuery({ merges, type: "comments" }));
    }
  );

  app.get(
    "/:configName/projectEffort",
    ensureUserCanAccessConfig(),
    (req, res) => {
      const merges = res.locals.getMerges();
      res.status(200).json(projectEffort({ merges }));
    }
  );

  app.get(
    "/:configName/activity/team",
    ensureUserCanAccessConfig(),
    (req, res) => {
      const merges = res.locals.getMerges();
      res.status(200).json(trends({ merges }));
    }
  );

  app.get(
    "/:configName/activity/approvals",
    ensureUserCanAccessConfig(),
    (req, res) => {
      const merges = res.locals.getMerges();
      res.status(200).json(activityQuery({ merges, type: "approvals" }));
    }
  );

  app.get(
    "/:configName/achievements",
    ensureUserCanAccessConfig(),
    (req, res) => {
      const merges = res.locals.getMerges();
      res.status(200).json(achievements({ merges }));
    }
  );

  app.get(
    "/:configName/activity/merges",
    ensureUserCanAccessConfig(),
    (req, res) => {
      const merges = res.locals.getMerges();

      res.status(200).json(activityQuery({ merges, type: "merges" }));
    }
  );

  app.get(
    "/:configName/deployments",
    ensureUserCanAccessConfig(),
    (req, res) => {
      const allDeployments = res.locals.getDeployments();

      res.status(200).json(deploymentQuery({ allDeployments }));
    }
  );
};

module.exports = service;
