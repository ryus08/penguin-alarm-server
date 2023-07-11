const paths = ["/healthcheck", "/livecheck"];

const service = ({ app }) => {
  paths.forEach((path) =>
    app.get(path, (req, res) => {
      res.status(200).send("OK");
    })
  );
};

service.paths = paths;

module.exports = service;
