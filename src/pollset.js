const _keys = require("lodash.keys");
const _includes = require("lodash.includes");

class PollSet {
  constructor({ pollFn }) {
    this.polls = {};
    this.pollFn = pollFn;
    this.shuttingDown = {};
  }

  sync({ groupIds }) {
    groupIds.forEach(groupId => {
      if (!this.polls[groupId]) {
        this.polls[groupId] = true;
        this.pollFn({ groupId });
      }
    });

    // anything that is no longer listed should be marked for shutdown
    _keys(this.polls).forEach(key => {
      if (!_includes(groupIds, parseInt(key, 10))) {
        this.shuttingDown[key] = true;
      }
    });
  }

  shutdown({ groupId }) {
    if (this.shuttingDown[groupId]) {
      delete this.shuttingDown[groupId];
      delete this.polls[groupId];
      return true;
    }
    return false;
  }
}

module.exports = PollSet;
