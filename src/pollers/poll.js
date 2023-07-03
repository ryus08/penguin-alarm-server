// const nr = require("newrelic"); TODO: Get configurable or document how to do this when installing/deploying.
// To do in a composable way, probably need to not-register the poller by default, but let the consumer
// provider a poll function, reccommending this one (through the thread of wrappers)

module.exports = ({ name, pollFunction }) => {
  const refresh = () => {
    pollFunction().then((refreshRate) => {
      if (refreshRate !== -1) {
        // eslint-disable-next-line no-console
        console.log(`${name} complete, will wait ${refreshRate}ms`);
        setTimeout(refresh, refreshRate);
      }
    });
  };
  refresh();
};
