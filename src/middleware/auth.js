module.exports = ({ app }) => {
  app.use((req, res, next) => {
    req.user = {
      sub: "local"
    };
    next();
  });
};
