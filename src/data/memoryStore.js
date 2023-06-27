/* eslint-disable camelcase */
const P = require("bluebird");
const _groupBy = require("lodash.groupby");

class MemoryStore {
  constructor() {
    this.db = {
      configs: {},
      opinions: {}
    };
  }

  getConfigs() {
    return P.resolve(Object.values(this.db.configs));
  }

  deleteConfig({ name }) {
    delete this.db.config[name];
    return P.resolve();
  }

  putConfig({ name, config }) {
    this.db.configs[name] = config;
    return P.resolve(config);
  }

  getAllOpinions() {
    return P.resolve(Object.values(this.db.opinions));
  }

  getOpinions({ sub }) {
    return this.getAllOpinions()
      .then(opinions => opinions.filter(opinion => opinion.sub === sub))
      .then(opinions => opinions.map(opinion => opinion.value))
      .then(values => _groupBy(values, "mergeId"));
  }

  putOpinion({ sub, project_id, iid, mergeId, sick, configName }) {
    const mergeIdSub = `${mergeId}-${sub}`;
    this.db.opinions[mergeIdSub] = {
      mergeIdSub,
      sub,
      value: {
        sick,
        configName,
        project_id,
        iid,
        mergeId
      }
    };
    return P.resolve(this.db.opinions[mergeIdSub]);
  }
}

const memoryStore = new MemoryStore();

module.exports = memoryStore;
