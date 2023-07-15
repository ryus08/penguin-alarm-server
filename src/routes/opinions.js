const _map = require("lodash.map");

const _get = require("lodash.get");
const { ensureUserCanAccessConfig } = require("../middleware/authorization");

const service = ({ app }) => {
  app.get("/:configName/opinions", ensureUserCanAccessConfig(), (req, res) => {
    const merges = res.locals.getMerges();

    res.locals.opinionDAO.getOpinions().then((opinions) => {
      const retVal = _map(merges, (merge) => ({
        title: merge.title,
        web_url: merge.web_url,
        projectName: merge.projectName,
        project_id: merge.project_id,
        iid: merge.iid,
        id: merge.id,
        sick: _get(opinions, `[${merge.id}][0].sick`)
      }));
      res.status(200).json(retVal);
    });
  });

  app.put(
    "/:configName/opinions/:merge_id",
    ensureUserCanAccessConfig(true),
    (req, res) => {
      res.locals.opinionDAO
        .putOpinion({
          mergeId: req.params.merge_id,
          project_id: req.body.project_id,
          iid: req.body.iid,
          sick: req.body.sick,
          configName: req.params.configName
        })
        .then(() => res.status(200).json({}));
    }
  );
};

module.exports = service;
