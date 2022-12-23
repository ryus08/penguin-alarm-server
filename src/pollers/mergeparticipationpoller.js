const _get = require("lodash.get");
const P = require("bluebird");
const mergeFetch = require("./mergefetch");
const deploymentFetch = require("./deploymentfetch");
const poll = require("./poll");

module.exports = ({ config, update, predictor }) => {
  poll({
    name: "merge participation",
    pollFunction: () => {
      const configuration = config();

      // no configuration at all, lets see if one comes in
      if (!configuration) {
        return P.resolve(1000);
      }

      // its not active any more, kill it off
      if (!configuration.active) {
        return P.resolve(-1);
      }

      if (
        !(
          configuration.gitLabClient &&
          configuration.groupIds &&
          configuration.pollRate &&
          configuration.jitterPercent
        )
      ) {
        return P.resolve(5000);
      }

      const numberOfDays = _get(configuration, "numberOfDays", 14);

      const { gitLabClient } = configuration;

      // give each project a 25% random jitter so we don't slam it all at once
      return (
        P.delay(
          Math.random() * (configuration.pollRate * configuration.jitterPercent)
        )
          // get all the projects for the given groups
          .then(() => configuration.gitLabClient.getProjects(configuration))
          // then get all the merge requests for each project
          .then(projects =>
            P.join(
              mergeFetch({
                projects,
                configuration,
                gitLabClient,
                numberOfDays,
                predictor
              }),
              deploymentFetch({ projects, configuration, gitLabClient }),
              (merges, deployments) => {
                // eslint-disable-next-line no-console
                console.warn(`${configuration.groupIds} complete`);
                update({ merges, deployments, numberOfDays });
              }
            )
          )
          .catch(e => {
            // eslint-disable-next-line no-console
            console.warn(e);
          })
          .return(configuration.pollRate)
      );
    }
  });
};
