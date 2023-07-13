const service = ({ app }) => {
  app.get("/preferences", (req, res) =>
    res.locals.preferencesDAO
      .getPreferences()
      .then((preferences) => res.status(200).json({ ...preferences }))
  );

  app.put("/preferences", (req, res) =>
    res.locals.preferencesDAO
      .setPreferences(req.body)
      .then((preferences) => res.status(200).json(preferences))
  );

  app.put("/preferences/gitProvider", (req, res) => {
    if (req.body.providerName !== "gitlab") {
      res
        .status(400)
        .send("Only gitlab as git provider is implemented at this time");
    } else {
      res.locals.preferencesDAO
        .setGitProvider(req.body)
        .then((gitProviderConfig) =>
          res.status(200).json({ providerName: gitProviderConfig.providerName })
        );
    }
  });

  app.delete("/preferences/gitProvider", (req, res) => {
    res.locals.preferencesDAO
      .deleteGitProvider()
      .then(() => res.status(202).end());
  });
};

module.exports = service;
