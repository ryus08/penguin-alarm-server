require("newrelic");
const { ExpressApp } = require("@cimpress-technology/belt");
const express = require("express");
const newRelicMiddleware = require("@cimpress-technology/newrelicmiddleware");
const beltErrorHandling = require("@cimpress-technology/belterrorhandling");
const {
  MIDDLEWARE_GROUPS
} = require("@cimpress-technology/belt/src/middleware/defaultmiddlewarelist");
const config = require("config");
const search = require("./routes/search");
const queries = require("./routes/queries");
const configData = require("./routes/configdata");
const opinions = require("./routes/opinions");
const predictions = require("./routes/predictions");
const pollSet = require("./middleware/pollset");
const getMerges = require("./middleware/getmerges");
const internalOnly = require("./middleware/internalonly");
const clientBuilder = require("./clients/clientbuilder");
const opinionMw = require("./middleware/opinions");
const mlConfig = require("./middleware/mlconfig");

let expressApp;

if (require.main === module) {
  expressApp = new ExpressApp({
    config,
    applicationMiddlewareList: [
      {
        priority: MIDDLEWARE_GROUPS.REQ_RES_LOGGING_TRACKING.start + 20,
        name: "newRelicMiddleware",
        middleware: newRelicMiddleware
      },
      {
        priority: MIDDLEWARE_GROUPS.AUTHORIZATION.start + 20,
        name: "InternalOnly",
        middleware: internalOnly
      },
      { middleware: beltErrorHandling },
      {
        priority: 1,
        name: "staticFiles",
        middleware: ({ app }) => app.use(express.static("./src/public"))
      },
      { middleware: pollSet },
      { middleware: getMerges },
      { middleware: clientBuilder },
      { middleware: mlConfig },
      { middleware: opinionMw }
    ],
    routes: [search, queries, configData, opinions, predictions]
  })
    .start()
    .then(server => {
      // eslint-disable-next-line no-console
      console.log(
        `${config.name} at http://${server.address().address}:${
          server.address().port
        }`
      );
    });
} else {
  module.exports = { expressApp };
}
