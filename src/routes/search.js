/* eslint-disable camelcase */
const _map = require("lodash.map");

const service = ({ app }) => {
  app.get("/groups", (req, res) => {
    const { name, asMaintainer } = req.query;

    // isNaN returns true when the value is not a number
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(name)) {
      const min_access_level = asMaintainer ? 40 : 10;
      res.locals.gitLabClient
        .groupSearch({ name, min_access_level })
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
      res.locals.gitLabClient
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
