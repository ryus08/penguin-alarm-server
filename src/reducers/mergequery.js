const numberOfDays = 14;
const _filter = require("lodash.filter");
const _map = require("lodash.map");
const moment = require("moment-business-time");
const MergeStats = require("./mergestats");

module.exports = ({ merges, includeWorkInProgress = false }) => {
  const d = new Date();
  d.setDate(d.getDate() - numberOfDays);

  const current = new MergeStats({
    merges: _filter(merges, merge => merge.created_at > d.toJSON()),
    days: numberOfDays
  });

  const old = new MergeStats({ merges, days: numberOfDays * 2 });

  return {
    active: _filter(
      merges,
      merge =>
        (includeWorkInProgress || !merge.work_in_progress) &&
        merge.state !== "merged"
    ),
    recent: _filter(
      merges,
      merge =>
        merge.state === "merged" &&
        moment().workingDiff(moment(merge.updated_at), "hours") <= 8
    ),
    all: _map(merges, merge => merge.web_url),
    mergeStats: current.totalScores(),
    teamStats: [
      {
        name: "Comment Rate",
        current: current.teamCommentRate(),
        previous: old.teamCommentRate()
      },
      {
        name: "Merge Rate",
        current: current.mergeRate(),
        previous: old.mergeRate()
      },
      {
        name: "Merge Time (hours)",
        current: current.mergeTime(),
        previous: old.mergeTime(),
        golf: true
      },
      {
        name: "Approval Time (hours)",
        current: current.approvalTime(),
        previous: old.approvalTime(),
        golf: true
      }
    ]
  };
};
