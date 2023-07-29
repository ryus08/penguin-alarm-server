module.exports = ({ app }) => {
  // Need this signature with 4 parameters for this to be picked up as an error handler by express,
  // Even if next() isn't used
  // eslint-disable-next-line no-unused-vars
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
