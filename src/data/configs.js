/* eslint-disable class-methods-use-this */
const _flatten = require("lodash.flatten");
const _uniq = require("lodash.uniq");
const _map = require("lodash.map");
const _keys = require("lodash.keys");

const configs = {};

class Configs {
  put({ name, data }) {
    configs[name] = data;
  }

  getKeys() {
    return _keys(configs);
  }

  getConfigs() {
    return configs;
  }

  get({ name }) {
    return configs[name];
  }

  remove({ name }) {
    delete configs[name];
  }

  getGroupIds() {
    return _uniq(_flatten(_map(configs, (config) => config.gitlab.groupIds)));
  }
}

const configData = new Configs();

module.exports = configData;
