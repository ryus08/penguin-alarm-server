const _map = require("lodash.map");
const _filter = require("lodash.filter");
const _sortBy = require("lodash.sortby");

module.exports = ({ deployments }) => {
  const d = new Date();
  d.setDate(d.getDate() - 14);
  const filtered = _filter(
    deployments,
    deployment => deployment.created_at > d.toISOString()
  );

  return _sortBy(
    _map(filtered, deployment => ({
      name: deployment.projectName,
      date: deployment.created_at,
      environment: deployment.environment.name,
      user: deployment.user
    })),
    "date"
  ).reverse();
};
