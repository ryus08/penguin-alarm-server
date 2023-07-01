const DynamoClient = require("../data/dynamoclient");
const MemoryStore = require("../data/memoryStore");
const CustomizrClient = require("../data/customizrClient");

module.exports = ({ app, config }) => {
  if (config.data.source === "dynamo") {
    app.locals.configDAO = new DynamoClient();
  } else {
    app.locals.configDAO = new MemoryStore();
  }
  app.use((req, res, next) => {
    if (config.data.source === "dynamo") {
      res.locals.opinionDAO = new DynamoClient(req.user.sub);
    } else {
      res.locals.opinionDAO = new MemoryStore(req.user.sub);
    }

    if (config.preferences.source === "customizr") {
      // TODO: if we have many more of these, make a builder
      res.locals.preferencesDAO = new CustomizrClient(
        req.header("Authorization")
      );
    } else {
      res.locals.preferencesDAO = new CustomizrClient(
        req.header("Authorization")
      );
      res.locals.preferencesDAO = new MemoryStore(req.user.sub);
    }
    next();
  });
};
