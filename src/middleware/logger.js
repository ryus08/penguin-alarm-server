const winston = require("winston");

module.exports = ({ app }) => {
  app.locals.logger = winston.createLogger({
    level: app.locals.config.logging.level,
    format: winston.format.json(),
    defaultMeta: { service: app.locals.config.logging.appName },
    transports: [new winston.transports.Console()]
  });
};
