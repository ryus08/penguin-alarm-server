const nr = require("newrelic");

module.exports = ({ name, pollFunction }) => {
  const refresh = () => {
    nr.startBackgroundTransaction(name, () =>
      pollFunction().then(refreshRate => {
        if (refreshRate !== -1) {
          // eslint-disable-next-line no-console
          console.log(`${name} complete, will wait ${refreshRate}ms`);
          setTimeout(refresh, refreshRate);
        }
      })
    );
  };
  refresh();
};
