const _filter = require("lodash.filter");
const MergeStats = require("./mergestats");

module.exports = ({ merges }) => {
  const getMergeStats = startDay => {
    const end = new Date();
    end.setDate(end.getDate() - (21 - startDay));

    const start = new Date();
    start.setDate(start.getDate() - (28 - startDay));

    return new MergeStats({
      merges: _filter(
        merges,
        merge =>
          merge.created_at > start.toJSON() && merge.created_at <= end.toJSON()
      ),
      days: 7
    });
  };

  const mergeRates = [];
  for (let i = 0; i < 21; i += 1) {
    const mergeStats = getMergeStats(i);
    mergeRates.push({
      dateIndex: i,
      mergeRate: mergeStats.mergeRate(),
      mergeTime: mergeStats.mergeTime(),
      approvalTime: mergeStats.approvalTime(),
      commentRate: mergeStats.teamCommentRate()
    });
  }
  return mergeRates;
};
