const _map = require("lodash.map");

const service = ({ app }) => {
  app.get("/groups", (req, res) => {
    const { name } = req.query;

    // isNaN returns true when the value is not a number
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(name)) {
      app.locals.gitLabClient
        .groupSearch({ name })
        .then((response) => {
          res.status(200).json(
            _map(response, (project) => ({
              id: project.id,
              name: project.name
            }))
          );
        })
        .catch(() => {
          res.status(500).json({});
        });
    } else {
      app.locals.gitLabClient
        .getGroup({ groupId: name })
        .then((project) => {
          res.status(200).json([{ id: project.id, name: project.name }]);
        })
        .catch(() => {
          res.status(500).json({});
        });
    }
  });
};

module.exports = service;
