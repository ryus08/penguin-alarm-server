module.exports = ({ app }) => {
  app.use((req, res, next) => {
    if (!req.user["https://claims.cimpress.io/cimpress_internal"]) {
      res.status(403).json({ message: "Invalid user for internal tools" });
    } else {
      next();
    }
  });
};
