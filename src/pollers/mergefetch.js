/* eslint-disable camelcase */
const P = require("bluebird");
const _filter = require("lodash.filter");
const _flatten = require("lodash.flatten");
const _map = require("lodash.map");
const _keys = require("lodash.keys");
const _forEach = require("lodash.foreach");
const _includes = require("lodash.includes");
const _concat = require("lodash.concat");
const _values = require("lodash.values");
const _get = require("lodash.get");
const _min = require("lodash.min");
const moment = require("moment-business-time");

moment.locale("en", {
  workinghours: {
    0: null,
    1: ["08:30:00", "17:30:00"],
    2: ["08:30:00", "17:30:00"],
    3: ["08:30:00", "17:30:00"],
    4: ["08:30:00", "17:30:00"],
    5: ["08:30:00", "17:30:00"],
    6: null
  },
  holidays: ["2017-11-23", "2017-11-24", "2017-12-24", "2017-12-25"]
});

const setApprovalTime = merge => {
  const approvals = _get(merge, "approvers.approved_by", []);
  const approved_at = approvals.length
    ? _min(approvals, "approved_at").approved_at
    : moment.utc();
  merge.approvalDiff =
    moment(approved_at).workingDiff(moment(merge.created_at), "minutes") / 60;
  return merge;
};

const setMergeTime = merge => {
  const mergeDate = merge.state === "merged" ? merge.updated_at : moment.utc();
  merge.mergeDiff =
    moment(mergeDate).workingDiff(moment(merge.created_at), "minutes") / 60;
  return merge;
};

module.exports = ({
  configuration,
  projects,
  gitLabClient,
  numberOfDays,
  predictor
}) => {
  // these are the merges we no longer need to watch
  // we'll have to dig up the ids of things we don't care about
  const oldMerges = _filter(
    configuration.merges,
    merge => merge.stopMonitoring
  );

  const oldMergeSet = {};
  _forEach(oldMerges, oldMerge => {
    oldMergeSet[oldMerge.web_url] = oldMerge;
  });

  const days = numberOfDays * 2;

  return (
    P.map(projects, project =>
      gitLabClient.getRecentMergeRequests(
        {
          projectId: project.id,
          projectName: project.name,
          numberOfDays: days
        },
        { concurrency: 3 }
      )
    )
      // flatten and drop any projects that had no merge requests
      .then(merges => _flatten(_filter(merges, merge => merge.length > 0)))
      // we don't care at all about closed merged
      .then(merges => _filter(merges, merge => merge.state !== "closed"))
      // now we need to filter this down to just active merges, and recently closed
      // merges
      .then(merges => {
        // we'll use the urls as unique ids
        const mergeIds = _map(merges, "web_url");

        // drop all the merges we already looked at
        const activeMerges = _filter(
          merges,
          merge => !oldMergeSet[merge.web_url]
        );

        // then drop all the old merges that have expired because they are not in this
        // update list
        const expiredValues = _filter(
          _keys(oldMergeSet),
          oldId => !_includes(mergeIds, oldId)
        );
        _forEach(expiredValues, expired => delete oldMergeSet[expired]);

        return activeMerges;
      })
      .map(merge => gitLabClient.addActivity({ merge }))
      .map(merge => gitLabClient.addChanges({ merge }))
      .map(merge => predictor({ merge }))
      .then(activeMerges => {
        activeMerges.forEach(activeMerge => {
          // if we hadn't seen this merge before, but its now merged,
          // we can stop looking at it
          if (activeMerge.state === "merged") {
            activeMerge.stopMonitoring = true;
          }
        });

        activeMerges.forEach(setApprovalTime);
        activeMerges.forEach(setMergeTime);

        // put the active and inactive merges together, its what we'll end up returning
        return _concat(_values(oldMergeSet), activeMerges);
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error(err);
        throw err;
      })
  );
};
