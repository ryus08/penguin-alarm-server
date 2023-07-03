/* eslint-disable camelcase, class-methods-use-this */
const NodeCache = require("node-cache");
const P = require("bluebird");
const _filter = require("lodash.filter");
const _forEach = require("lodash.foreach");

const liveBatchCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
const predictionCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });
const keyFn = ({ project_id, iid }) => `${project_id}-${iid}`;

class PredictionCache {
  get({ project_id, iid, missStatsPromise }) {
    const key = keyFn({ project_id, iid });
    const cachedValue = predictionCache.get(key);

    // if its cached, awesome
    if (cachedValue) {
      return P.resolve(cachedValue);
    }

    // if its not cached, then hopefully we have a way to get it
    if (!missStatsPromise) {
      return P.reject(new Error("Prediction not currently available"));
    }

    return missStatsPromise();
  }

  set({ project_id, iid, prediction }) {
    predictionCache.set(keyFn({ project_id, iid }), prediction);
  }

  missing(merges) {
    const retVal = _filter(
      merges,
      (merge) => !predictionCache.get(keyFn(merge.project_id, merge.iid))
    );

    return retVal;
  }

  getLivePrediction({ project_id, iid }) {
    return liveBatchCache.get(keyFn({ project_id, iid }));
  }

  setLivePredictions({ merges, batchId }) {
    _forEach(merges, (merge) => {
      liveBatchCache.set(keyFn(merge), batchId);
    });
  }
}

module.exports = PredictionCache;
