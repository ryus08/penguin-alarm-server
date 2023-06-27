const dynamoClient = require("../data/dynamoclient");
const memoryStore = require("../data/memoryStore");

module.exports = ({ app, config }) => {
  if (config.data.source === "dynamo") {
    app.locals.configDAO = dynamoClient;
    app.locals.opinionDAO = dynamoClient;
  } else {
    app.locals.configDAO = memoryStore;
    app.locals.opinionDAO = memoryStore;
  }
};
