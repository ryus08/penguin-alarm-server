const _filter = require("lodash.filter");
const _sortBy = require("lodash.sortby");
const _get = require("lodash.get");
const _map = require("lodash.map");
const _find = require("lodash.find");
const _maxBy = require("lodash.maxby");

const parseActive = ({ active, username }) => {
  const isActive = _map(active, (merge) => {
    merge.reviewed = merge.author.username === username;
    return merge;
  });

  const computeLastChange = (merge) => {
    const commits = _filter(
      merge.systemComments,
      (comment) => comment.type === null && comment.body.startsWith("added ")
    );

    return _get(_maxBy(commits, "created_at"), "created_at");
  };

  const computeUrgency = (merge) => {
    let urgency = 0;

    // if the user has made a comment, but there's been changes
    // we'd like them to look at those changes, slightly more than
    // changes post-approval with the assumption that those changes
    // are possibly because they asked for them
    if (merge.updates.sinceComment) {
      urgency += 2;
    } else if (merge.updates.sinceApproval) {
      urgency += 3;
    }

    // but if they haven't approved at all, that's far more urgent
    if (!merge.userApproved && !merge.isAuthor) {
      urgency += 5;
      // slightly less urgent if you've at least made comments
      if (merge.yourComments.length) {
        urgency -= 1;
      }
    }

    // if you can merge it, you should really take care of it!
    if (merge.youCanMerge) {
      urgency += 6;
    }

    // if the merge request has problems, it becomes more urgent whether you've
    // approved it or not
    if (_get(merge, "prediction.Prediction.predictedLabel") === "bad") {
      urgency += 3;
    }
    return urgency;
  };

  const allMerges = _map(isActive, (merge) => {
    merge.userApproved = _find(
      merge.approvers.approved_by,
      (approver) => _get(approver, "user.username") === username
    );
    merge.isAuthor = merge.author.username === username;
    merge.youCanMerge = merge.isAuthor && merge.approvers.approvals_left === 0;
    merge.lastChange = computeLastChange(merge);
    merge.yourComments = _sortBy(
      _filter(
        merge.comments,
        (comment) => comment.author.username === username && !merge.isAuthor
      ),
      "created_at"
    ).reverse();

    merge.updates = {
      sinceApproval:
        merge.userApproved && merge.lastChange > merge.userApproved.approved_at,
      sinceComment: merge.lastChange > _get(merge, "yourComments[0].created_at")
    };

    merge.urgency = computeUrgency(merge);
    return merge;
  });

  return _sortBy(
    _sortBy(allMerges, "updated_at").reverse(),
    "urgency"
  ).reverse();
};

const openMerge = ({ merges, username, includeWorkInProgress = false }) => {
  const active = _filter(
    merges,
    (merge) =>
      (includeWorkInProgress || !merge.work_in_progress) &&
      merge.state !== "merged"
  );
  return parseActive({ active, username });
};

module.exports = openMerge;
