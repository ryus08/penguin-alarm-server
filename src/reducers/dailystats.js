const _flatMap = require("lodash.flatmap");
const _map = require("lodash.map");
const _groupBy = require("lodash.groupby");
const _filter = require("lodash.filter");
const _merge = require("lodash.merge");
const _forEach = require("lodash.foreach");
const _maxBy = require("lodash.maxby");
const dateUtil = require("../util/date");

const excludedUsers = [
  7850684, // Checkmarx user (comments on most merge requests)
  5797148 // Lingotek user (opens merge requests for translations)
];

const getDateIndex = (dateTime) => 28 - dateUtil.dateDiff(dateTime);

const latestPerUser = (formatted) => {
  const grouped = _groupBy(formatted, "user.author");
  const retVal = [];
  _forEach(grouped, (value) => {
    retVal.push(_maxBy(value, "dateIndex"));
  });
  return retVal;
};

const approverMap = (approver) => ({
  author: approver.user.id,
  authorName: approver.user.name,
  username: approver.user.username,
  avatar: approver.user.avatar_url,
  dateIndex: getDateIndex(approver.approved_at)
});

const commentMap = (comment) => ({
  author: comment.author.id,
  authorName: comment.author.name,
  avatar: comment.author.avatar_url,
  username: comment.author.username,
  dateIndex: getDateIndex(comment.created_at)
});

const authorMap = (author, time, data) => {
  const retVal = {
    author: author.id,
    authorName: author.name,
    username: author.username,
    avatar: author.avatar_url,
    dateIndex: 28 - dateUtil.dateDiff(time)
  };
  return _merge(retVal, data);
};

const dailyCount = ({ merges, reduction }) => {
  // pull the content type
  const content = reduction(merges);

  // filter out some non-humans
  const filteredContent = _filter(
    content,
    (item) => !excludedUsers.includes(item.author)
  );

  // group it by days
  const groups = _groupBy(filteredContent, (data) =>
    JSON.stringify({
      dateIndex: data.dateIndex,
      author: data.author,
      avatar: data.avatar,
      username: data.username,
      name: data.authorName
    })
  );

  // then add the length of each of these groups (the quantity per day)
  return _map(groups, (value, key) => {
    const groupedData = JSON.parse(key);
    const { dateIndex } = groupedData;
    delete groupedData.dateIndex;
    return {
      dateIndex,
      count: value.length,
      user: groupedData
    };
  });
};

module.exports = {
  comments: (merges) =>
    _map(_flatMap(merges, "comments"), (comment) => commentMap(comment)),

  mergedNoApproval: (merges) =>
    _map(
      _filter(
        merges,
        (merge) =>
          merge.state === "merged" && merge.approvers.approved_by.length === 0
      ),
      (merge) => authorMap(merge.author, merge.updated_at)
    ),

  tooSoon: (merges) => {
    const tooSoonApprovals = _flatMap(merges, (merge) =>
      _filter(merge.approvers.approved_by, (approval) => {
        const laterComments = _filter(
          merge.comments,
          (comment) => comment.created_at > approval.approved_at
        );

        return laterComments.length > 5;
      })
    );

    return _map(tooSoonApprovals, (approver) => approverMap(approver));
  },

  approvals: (merges) =>
    // for each merge, go through each approver to find the latest time they approved
    _flatMap(merges, (merge) =>
      _map(merge.approvers.approved_by, (approver) => approverMap(approver))
    ),
  merges: (merges) =>
    _filter(
      _flatMap(merges, (merge) =>
        authorMap(merge.author, merge.updated_at, { state: merge.state })
      ),
      (merge) => merge.state === "merged"
    ),

  created: (merges) =>
    _flatMap(merges, (merge) =>
      authorMap(merge.author, merge.created_at, { state: merge.state })
    ),

  quick: (merges) =>
    _filter(
      _flatMap(merges, (merge) =>
        authorMap(merge.author, merge.updated_at, {
          state: merge.state,
          updated_at: merge.updated_at,
          created_at: merge.created_at,
          approvers: merge.approvers
        })
      ),
      (merge) =>
        merge.state === "merged" &&
        merge.approvers.approved_by.length > 0 &&
        dateUtil.minuteDiff(merge.created_at, merge.updated_at) < 5
    ),
  dailyCount,
  latestPerUser
};
