const mergeParticipationPoller = require("../pollers/mergeparticipationpoller");
const Pollset = require("../pollset");
const pollinstance = require("../pollinstance");
const configs = require("../data/configs");

module.exports = ({ app, config }) => {
  const isActive = (groupId) => !app.locals.pollset.shutdown({ groupId });

  const pollFn = ({ groupId }) => {
    const pollInst = pollinstance({
      groupId,
      isActive,
      gitLabClient: app.locals.gitLabClient,
      pollRate: parseInt(config.pollRate, 10),
      jitterPercent: parseFloat(config.jitterPercent)
    });

    pollInst.predictor = ({ merge }) =>
      app.locals.machineLearning
        .predict({ merge })
        // eslint-disable-next-line no-return-assign
        .then((prediction) => (merge.prediction = prediction))
        .return(merge);

    mergeParticipationPoller(pollInst);
  };

  const pollSet = new Pollset({ pollFn });

  app.locals.configDAO.getConfigs().then((results) => {
    results.forEach((result) => {
      configs.put({ name: result.name, data: result.config });
    });
    pollSet.sync({ groupIds: configs.getGroupIds() });
  });

  app.locals.pollset = pollSet;
};
