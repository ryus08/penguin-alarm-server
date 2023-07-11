module.exports = ({ app }) => {
  app.use((err, req, res, next) => {
    if (
      err.name === "UnauthorizedError" ||
      err.name === "SigningKeyNotFoundError"
    ) {
      res.status(401).send("Unauthorized");
    } else {
      // TODO, better top level error handler
      next(err);
    }
  });
};
