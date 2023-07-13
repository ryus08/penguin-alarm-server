/* eslint-disable class-methods-use-this */
/* eslint-disable camelcase */
const P = require("bluebird");
const _groupBy = require("lodash.groupby");

const db = {
  configs: {},
  opinions: {},
  preferences: {},
  gitProviders: {}
};

class MemoryStore {
  constructor(user) {
    this.user = user;
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
        opinions.filter((opinion) => opinion.sub === this.user.sub)
      )
      .then((opinions) => opinions.map((opinion) => opinion.value))
      .then((values) => _groupBy(values, "mergeId"));
  }

  putOpinion({ project_id, iid, mergeId, sick, configName }) {
    const mergeIdSub = `${mergeId}-${this.user.sub}`;
    db.opinions[mergeIdSub] = {
      mergeIdSub,
      sub: this.user.sub,
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
    return P.resolve({
      ...db.preferences[this.user.sub],
      gitProvider: (db.gitProviders[this.user.sub] || {}).providerName
    });
  }

  setPreferences(preferences) {
    db.preferences[this.user.sub] = preferences;
    return P.resolve(preferences);
  }

  setGitProvider(gitProviderConfig) {
    db.gitProviders[this.user.sub] = gitProviderConfig;
    return P.resolve(gitProviderConfig);
  }

  deleteGitProvider() {
    delete db.gitProviders[this.user.sub];
    return P.resolve();
  }
}

module.exports = MemoryStore;
