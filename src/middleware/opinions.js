/* eslint-disable camelcase */
const dynamoClient = require("../data/dynamoclient");

module.exports = ({ app, logger }) => {
  app.use((req, res, next) => {
    res.locals.opinions = () =>
      dynamoClient.getOpinions({ sub: req.user.sub }).catch(e => {
        logger.warn(e);
      });

    res.locals.recordOpinion = ({
      mergeId,
      project_id,
      iid,
      sick,
      configName
    }) =>
      dynamoClient.putOpinion({
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
