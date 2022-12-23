const _flatten = require("lodash.flatten");
const _forEach = require("lodash.foreach");
const _map = require("lodash.map");
const _filter = require("lodash.filter");
const _groupBy = require("lodash.groupby");
const _sortBy = require("lodash.sortby");
const _get = require("lodash.get");

const productionValues = ["prod", "prd"];

module.exports = ({ allDeployments }) => {
  const lastPoll = new Date();
  lastPoll.setDate(lastPoll.getDate() - 1);

  const byProject = _groupBy(allDeployments, "projectName");
  const isProductionDeployment = deployment => {
    let isProdDeploy = false;
    if (deployment) {
      const deploymentName = _get(deployment, "environment.name");
      productionValues.forEach(value => {
        if (deploymentName && deploymentName.toLowerCase().includes(value)) {
          isProdDeploy = true;
        }
      });
    }
    return isProdDeploy;
  };

  let projectStats = [];
  _forEach(byProject, (value, key) => {
    const sorted = _sortBy(value, "created_at");
    const latestDeploy = sorted[sorted.length - 1];
    projectStats.push({
      name: key,
      first: sorted[0].created_at,
      inProd: isProductionDeployment(latestDeploy),
      numberOfDeployments: sorted.length,
      last: latestDeploy.created_at,
      projectUrl: `${latestDeploy.projectUrl}/pipelines/${latestDeploy.deployable.pipeline.id}`
    });
  });

  projectStats = _sortBy(projectStats, "last").reverse();

  const productionDeployments = _filter(allDeployments, deployment =>
    isProductionDeployment(deployment)
  );

  let recentDeployments = _filter(productionDeployments, deployment => {
    const dateDeployed = new Date(deployment.created_at);
    return dateDeployed > lastPoll;
  });

  if (recentDeployments.length < 5) {
    recentDeployments = _sortBy(productionDeployments, "created_at")
      .reverse()
      .slice(0, 5);
  }

  const deployments = _map(_flatten(recentDeployments), deploy => ({
    projectName: deploy.projectName,
    deploymentTime: deploy.created_at,
    userName: deploy.user.name,
    projectAvatar: deploy.projectAvatar,
    userAvatar: deploy.user.avatar_url,
    projectUrl: `${deploy.projectUrl}/environments/${deploy.environment.id}`
  }));

  return {
    deployments,
    projectStats
  };
};
