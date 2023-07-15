const uuidv4 = require("uuid/v4");
const strongOpinions = require("../prediction/strongopinions");
const { ensureAdmin } = require("../middleware/authorization");

const service = ({ app }) => {
  app.get("/predictions/:project_id/:iid", ensureAdmin(), (req, res) =>
    app.locals.machineLearning
      .predict({
        merge: req.params
      })
      .then((prediction) => {
        res.status(200).json(prediction);
      })
      .catch((err) => res.status(500).json(err))
  );

  app.post("/models", ensureAdmin(), (req, res) =>
    app.locals.opinionDAO
      .getAllOpinions()
      .then((allOpinions) => strongOpinions(req.body, allOpinions))
      .then((merges) =>
        app.locals.machineLearning.createModel({
          sourceData: merges,
          s3FileName: `training-${uuidv4()}.csv`
        })
      )
      .then(() => res.status(204).json({}))
      .catch((err) => res.status(500).json(err))
  );

  app.get("/models", ensureAdmin(), (req, res) =>
    app.locals.machineLearning.getModels().then((models) => {
      res.status(200).json(models);
    })
  );

  app.put("/models/active/:id", ensureAdmin(), (req, res) => {
    app.locals.machineLearning
      .setActiveModel(req.params.id)
      .then(() => res.status(204).json({}));
  });
};

module.exports = service;
