const _get = require("lodash.get");
const groupData = require("./data/groupdata");

module.exports = ({
  groupId,
  isActive,
  gitLabClient,
  pollRate = 300000,
  jitterPercent = 0.25
}) => ({
  config: () => ({
    gitLabClient,
    groupIds: [groupId],
    merges: _get(groupData.get({ groupId }), "merges", []),
    deployments: _get(groupData.get({ groupId }), "deployments", []),
    active: isActive(groupId),
    pollRate,
    jitterPercent
  }),
  update: ({ merges, deployments }) => {
    groupData.set({ groupId, data: { merges, deployments } });
  }
});
