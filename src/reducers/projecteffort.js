const _filter = require("lodash.filter");
const MergeStats = require("./mergestats");

const numberOfDays = 14;

module.exports = ({ merges }) => {
  const d = new Date();
  d.setDate(d.getDate() - numberOfDays);

  const current = new MergeStats({
    merges: _filter(merges, (merge) => merge.created_at > d.toJSON()),
    days: numberOfDays
  });

  const old = new MergeStats({ merges, days: numberOfDays * 2 });

  return {
    latest: current.projectScores(),
    total: old.projectScores()
  };
};
