/* eslint-disable camelcase */

module.exports = ({ app, logger }) => {
  app.use((req, res, next) => {
    res.locals.opinions = () =>
      app.locals.opinionDAO.getOpinions({ sub: req.user.sub }).catch(e => {
        logger.warn(e);
      });

    res.locals.recordOpinion = ({
      mergeId,
      project_id,
      iid,
      sick,
      configName
    }) =>
      app.locals.opinionDAO.putOpinion({
        sub: req.user.sub,
        project_id,
        iid,
        mergeId,
        sick,
        configName
      });

    next();
  });
};
