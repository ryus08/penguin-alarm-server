/* eslint-disable class-methods-use-this */
/* eslint-disable camelcase */
const P = require("bluebird");
const _groupBy = require("lodash.groupby");

const db = {
  configs: {},
  opinions: {},
  preferences: {}
};

class MemoryStore {
  constructor(userSub) {
    this.userSub = userSub;
  }

  getConfigs() {
    return P.resolve(Object.values(db.configs));
  }

  deleteConfig({ name }) {
    delete db.config[name];
    return P.resolve();
  }

  putConfig({ name, config }) {
    db.configs[name] = config;
    return P.resolve(config);
  }

  getAllOpinions() {
    return P.resolve(Object.values(db.opinions));
  }

  getOpinions() {
    return this.getAllOpinions()
      .then((opinions) =>
        opinions.filter((opinion) => opinion.sub === this.userSub)
      )
      .then((opinions) => opinions.map((opinion) => opinion.value))
      .then((values) => _groupBy(values, "mergeId"));
  }

  putOpinion({ project_id, iid, mergeId, sick, configName }) {
    const mergeIdSub = `${mergeId}-${this.userSub}`;
    db.opinions[mergeIdSub] = {
      mergeIdSub,
      sub: this.userSub,
      value: {
        sick,
        configName,
        project_id,
        iid,
        mergeId
      }
    };
    return P.resolve(db.opinions[mergeIdSub]);
  }

  getPreferences() {
    return P.resolve(db.preferences[this.userSub]);
  }

  setPreferences(preferences) {
    db.preferences[this.userSub] = preferences;
    return P.resolve(preferences);
  }
}

module.exports = MemoryStore;
