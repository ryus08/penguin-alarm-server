/* eslint-disable camelcase */
const _flatten = require("lodash.flatten");
const _map = require("lodash.map");
const _get = require("lodash.get");
const _compact = require("lodash.compact");
const _flatMap = require("lodash.flatmap");
const P = require("bluebird");
const groupData = require("../data/groupdata");
const configs = require("../data/configs");

module.exports = ({ app }) => {
  app.use((req, res, next) => {
    res.locals.getTeamConfig = () => {
      if (res.locals.teamConfig) {
        return res.locals.teamConfig;
      }

      const name = req.params.configName;
      res.locals.teamConfig = configs.get({ name });
      return res.locals.teamConfig;
    };

    res.locals.getMerges = () => {
      const teamConfig = res.locals.getTeamConfig();
      const merges = _flatten(
        _map(teamConfig.gitlab.groupIds, (groupId) =>
          _get(groupData.get({ groupId }), "merges")
        )
      );
      return _compact(merges);
    };

    res.locals.getDeployments = () => {
      const teamConfig = res.locals.getTeamConfig();
      return _compact(
        _flatten(
          _map(teamConfig.gitlab.groupIds, (groupId) => {
            const results = _get(groupData.get({ groupId }), "deployments", []);
            return _flatMap(results, "deployments");
          })
        )
      );
    };

    // This doesn't seem used, and app.locals.reduceMergeToStats doesn't seem defined.
    app.locals.getMergeStats = ({ project_id, iid }) => {
      const merge = groupData.getMerge({ project_id, iid });

      const mergePromise = merge
        ? P.resolve(merge)
        : app.locals.gitLabClient.getMergeRequest(req.params);

      return mergePromise
        .then((mrg) => app.locals.gitLabClient.addChanges({ merge: mrg }))
        .then((mrg) => app.locals.reduceMergeToStats({ merge: mrg }));
    };

    next();
  });
};
