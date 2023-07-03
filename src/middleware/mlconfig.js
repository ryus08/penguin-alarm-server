/* eslint-disable camelcase */
const P = require("bluebird");
const moment = require("moment-business-time");
const _get = require("lodash.get");
const _min = require("lodash.min");
const groupData = require("../data/groupdata");
const MachineLearning = require("../data/machinelearning");

module.exports = ({ app, config }) => {
  const getApprovalTime = (merge) => {
    const approvals = _get(merge, "approvers.approved_by", []);
    const approved_at = approvals.length
      ? _min(approvals, "approved_at").approved_at
      : moment.utc();
    return (
      moment(approved_at).workingDiff(moment(merge.created_at), "minutes") / 60
    );
  };

  const getMergeTime = (merge) => {
    const mergeDate =
      merge.state === "merged" ? merge.updated_at : moment.utc();
    return (
      moment(mergeDate).workingDiff(moment(merge.created_at), "minutes") / 60
    );
  };

  const reducer = ({ merge }) => ({
    changes: merge.changeStats.changeCount,
    comments: merge.comments.length,
    mergeTime: getMergeTime(merge),
    approvalTime: getApprovalTime(merge),
    project_id: merge.project_id
  });

  const statsFetch = (merges) =>
    P.map(
      merges,
      (merge) => {
        // if we already have the the thing in memory, then we should use that
        const existingMerge = groupData.getMerge(merge);
        const mergePromise = existingMerge
          ? app.locals.gitLabClient.addChanges({ merge: existingMerge })
          : app.locals.gitLabClient.getMergeRequest(merge);

        return mergePromise
          .then((mergeData) => reducer({ merge: mergeData }))
          .then((stats) => {
            if (merge.concensus) {
              stats.sickness = merge.concensus === "bad";
            }
            return stats;
          });
      },
      { concurrency: 3 }
    );

  if (config.activeModel) {
    app.locals.machineLearning = new MachineLearning({
      statsFetch,
      reducer,
      modelId: config.activeModel
    });
  } else {
    app.locals.machineLearning = {
      predict: () => P.resolve({})
    };
  }
};
