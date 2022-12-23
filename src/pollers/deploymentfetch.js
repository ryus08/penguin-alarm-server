/* eslint-disable camelcase */
const P = require("bluebird");
const _flatten = require("lodash.flatten");
const _find = require("lodash.find");

module.exports = ({ configuration, projects, gitLabClient }) =>
  P.map(
    projects,
    project => {
      const proj = project;
      proj.previous = _find(
        configuration.deployments,
        deployment => deployment.id === proj.id
      );
      return gitLabClient.getDeployments(proj).catch(e => {
        // eslint-disable-next-line no-console
        console.warn(e);
      });
    },
    { concurrency: 3 }
  ).then(deployments => _flatten(deployments));
