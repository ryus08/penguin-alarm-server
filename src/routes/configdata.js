const configs = require("../data/configs");
const {
  ensureUserCanAccessConfig,
  userCanAccessConfig
} = require("../middleware/authorization");

const service = ({ app, config }) => {
  app.get(
    "/configurations/:configName",
    ensureUserCanAccessConfig(),
    (req, res) => {
      res.status(200).json(configs.get({ name: req.params.configName }));
    }
  );

  app.get("/configurations", (req, res) => {
    const retVal = Object.entries(configs.getConfigs())
      .filter(([, thisConfig]) => {
        return userCanAccessConfig(req, thisConfig);
      })
      .map(([key]) => ({
        id: key,
        link: `${config.selfUrl}/configuration/${key}`
      }));
    res.status(200).json(retVal);
  });

  app.delete(
    "/configurations/:configName",
    ensureUserCanAccessConfig(true),
    (req, res) => {
      const name = req.params.configName;
      app.locals.configDAO
        .deleteConfig({ name })
        .then(() => {
          configs.remove({ name });
          app.locals.pollset.sync({ groupIds: configs.getGroupIds() });
          res.status(204).json();
        })
        .catch((e) => {
          res.status(500).json({ message: e.message });
        });
    }
  );

  app.put(
    "/configurations/:configName",
    ensureUserCanAccessConfig(true),
    (req, res) => {
      const name = req.params.configName;

      if (
        req.body.newrelic &&
        !req.body.newrelic.policy &&
        !req.body.newrelic.policies
      ) {
        return res
          .status(400)
          .json("Either newrelic.policy or newrelic.policies must be provided");
      }

      return app.locals.configDAO
        .putConfig({ name, config: req.body })
        .then(() => {
          configs.put({ name, data: req.body });
          app.locals.pollset.sync({ groupIds: configs.getGroupIds() });
          res.status(200).json(req.body);
        })
        .catch((e) => res.status(500).json({ message: e.message }));
    }
  );
};

module.exports = service;
