// require("newrelic"); TODO: Get configurable or document how to do this when installing/deploying.
// Maybe just turn this into a package, so this line is just loading in the "real" importer.
// Also "@cimpress-technology/newrelicmiddleware", so probably need to allow the caller to pass middleware
const express = require("express");
const config = require("config");
const cors = require("cors");
const search = require("./routes/search");
const queries = require("./routes/queries");
const configData = require("./routes/configdata");
const opinions = require("./routes/opinions");
const predictions = require("./routes/predictions");
const logger = require("./middleware/logger");
const dataAccess = require("./middleware/dataAccess");
const pollSet = require("./middleware/pollset");
const getMerges = require("./middleware/getmerges");
// const internalOnly = require("./middleware/internalonly");
const clientBuilder = require("./clients/clientbuilder");
const opinionMw = require("./middleware/opinions");
const mlConfig = require("./middleware/mlconfig");

const app = express();

if (require.main === module) {
  app.locals.config = config;
  app.use(cors());
  app.use(express.json());
  logger({ app });
  // internalonly({ app });
  dataAccess({ app, config });
  pollSet({ app, config });
  getMerges({ app, config });
  clientBuilder({ app, config });
  mlConfig({ app, config });
  opinionMw({ app, config });
  search({ app, config });
  queries({ app, config });
  configData({ app, config });
  opinions({ app, config });
  predictions({ app, config });
  app.use(express.static("./src/public"));
  app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`${config.name} at ${config.selfUrl}`);
  });
} else {
  module.exports = { expressApp: app };
}
