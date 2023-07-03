const service = ({ app }) => {
  app.get("/preferences", (req, res) =>
    res.locals.preferencesDAO
      .getPreferences()
      .then((preferences) => res.status(200).json(preferences))
  );

  app.put("/preferences", (req, res) =>
    res.locals.preferencesDAO
      .setPreferences(req.body)
      .then((preferences) => res.status(200).json(preferences))
  );
};

module.exports = service;
