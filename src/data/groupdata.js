/* eslint-disable camelcase */
const _forIn = require("lodash.forin");
const _find = require("lodash.find");
const _flatten = require("lodash.flatten");
const _map = require("lodash.map");

const totalData = {};

module.exports = {
  get: ({ groupId }) => totalData[groupId],

  set: ({ groupId, data }) => {
    totalData[groupId] = data;
  },

  getMerge: ({ project_id, iid }) => {
    let merge;
    _forIn(totalData, value => {
      const found = _find(
        value.merges,
        mrg => mrg.project_id === project_id && mrg.iid === iid
      );
      if (found) {
        merge = found;
      }
    });
    return merge;
  },

  getAllMerges: () => _flatten(_map(_flatten(_map(totalData)), "merges"))
};
