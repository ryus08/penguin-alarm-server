module.exports = ({ app }) => {
  app.use((err, req, res, next) => {
    if (
      err.name === "UnauthorizedError" ||
      err.name === "SigningKeyNotFoundError"
    ) {
      res.status(401).send("Unauthorized");
    } else if (err.name === "Forbidden") {
      res.status(403).send("Forbidden");
    } else {
      app.locals.logger.error(err);
      res.status(500).send("An unexpected error occurred");
    }
  });
};
