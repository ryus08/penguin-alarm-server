const _filter = require("lodash.filter");
const _flatMap = require("lodash.flatmap");
const _map = require("lodash.map");
const _get = require("lodash.get");
const _orderBy = require("lodash.orderby");
const _meanBy = require("lodash.meanby");
const _countBy = require("lodash.countby");
const _mapValues = require("lodash.mapvalues");
const _concat = require("lodash.concat");
const _forEach = require("lodash.foreach");
const _uniqWith = require("lodash.uniqwith");
const _assign = require("lodash.assign");
const _assignWith = require("lodash.assignwith");
const _isEqual = require("lodash.isequal");
const _forIn = require("lodash.forin");
const _pickBy = require("lodash.pickby");
const _uniq = require("lodash.uniq");
const _groupBy = require("lodash.groupby");
const _sumBy = require("lodash.sumby");
const moment = require("moment-business-time");

class MergeStats {
  constructor({ merges, days }) {
    this.merges = merges;
    this.days = days;
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
  }

  comments() {
    return _flatMap(this.merges, merge => merge.comments);
  }

  merged() {
    return _filter(
      this.merges,
      merge =>
        merge.state === "merged" && merge.approvers.approved_by.length > 0
    );
  }

  mergeTime() {
    const mergeTimes = _orderBy(this.merges, "mergeDiff");

    return _meanBy(mergeTimes, "mergeDiff");
  }

  approvedMerges() {
    return _filter(
      this.merges,
      merge => _get(merge, "approvers.approved_by", []).length > 0
    );
  }

  approvalTime() {
    return _meanBy(this.merges, "approvalDiff");
  }

  mergeRate() {
    return this.merged().length / this.days;
  }

  commentScoresByUser() {
    const allComments = this.comments();
    const commentRawScores = _countBy(allComments, comment =>
      _get(comment, "author.id")
    );
    return _mapValues(commentRawScores, score => ({
      raw: score,
      score: (score / allComments.length) * 50
    }));
  }

  commentScoresByProject() {
    const allComments = this.comments();
    const mergeGroups = _groupBy(this.merges, "projectName");
    return _mapValues(mergeGroups, merges => {
      const count = _sumBy(merges, merge => merge.comments.length);
      return { raw: count, score: (count / allComments.length) * 50 };
    });
  }

  projects() {
    return _uniq(_map(this.merges, merge => merge.projectName));
  }

  mergeScoresByProject() {
    const mergeGroups = _groupBy(this.merges, "projectName");
    return _mapValues(mergeGroups, merges => ({
      raw: merges.length,
      score: (merges.length / this.merges.length) * 50
    }));
  }

  approvalScores() {
    const approved = this.approvedMerges();
    const allApprovals = _flatMap(approved, merge =>
      _get(merge, "approvers.approved_by", [])
    );
    const approvalRawScores = _countBy(allApprovals, approval =>
      _get(approval, "user.id")
    );
    return _mapValues(approvalRawScores, score => ({
      raw: score,
      score: (score / approved.length) * 50
    }));
  }

  people() {
    if (this.peopleValue) {
      return this.peopleValue;
    }

    const retVal = {};
    const authors = _uniqWith(
      _map(this.merges, merge => ({
        id: merge.author.id,
        avatar_url: merge.author.avatar_url
      })),
      _isEqual
    );

    const allComments = this.comments();
    const commentors = _uniqWith(
      _map(allComments, comment => ({
        id: comment.author.id,
        avatar_url: comment.author.avatar_url
      })),
      _isEqual
    );

    const approved = this.approvedMerges();
    const allApprovals = _flatMap(approved, merge =>
      _get(merge, "approvers.approved_by", [])
    );

    const approvers = _uniqWith(
      _map(allApprovals, approval => ({
        id: approval.user.id,
        avatar_url: approval.user.avatar_url
      })),
      _isEqual
    );

    const people = _concat(authors, commentors, approvers);

    _forEach(people, person => {
      retVal[person.id] = person;
    });

    this.peopleValue = retVal;
    return retVal;
  }

  authors() {
    return _countBy(this.merges, merge => _get(merge, "author.id"));
  }

  teamCommentRate() {
    const unlawfulMerges = _filter(
      this.merges,
      merge =>
        merge.approvers.approved_by.length === 0 && merge.state === "merged"
    );
    return (
      this.comments().length / (this.merges.length - unlawfulMerges.length)
    );
  }

  projectScores() {
    const commentScores = this.commentScoresByProject();
    const mergeScores = this.mergeScoresByProject();
    _assignWith(mergeScores, commentScores, (merge, comment) => ({
      score: comment.score + merge.score,
      comments: comment.raw,
      merges: merge.raw
    }));

    let retVal = [];
    _forIn(mergeScores, (value, key) => {
      retVal.push({ id: key, data: value });
    });

    retVal = _orderBy(retVal, "data.score", "desc");

    return retVal;
  }

  totalScores() {
    const people = this.people();
    const commentScores = this.commentScoresByUser();
    const approvalScores = this.approvalScores();
    const authors = this.authors();

    let scores = _assign({}, people);
    _forIn(scores, value => {
      value.authored = 0;
      value.participated = this.merges.length;
      value.score = 0;
    });

    _assignWith(scores, authors, (score, author) => ({
      score: 0,
      avatar_url: score.avatar_url,
      authored: author || 0,
      participated: this.merges.length - (author || 0)
    }));

    // then add the approval score
    _assignWith(scores, approvalScores, (score, approvalScore) => ({
      approvals: approvalScore.raw,
      score: score.score + approvalScore.score,
      avatar_url: score.avatar_url,
      authored: score.authored,
      participated: score.participated
    }));

    // sum up both kinds of scores
    _assignWith(scores, commentScores, (score, comment) => ({
      score: score.score + comment.score,
      comments: comment.raw,
      approvals: score.approvals,
      avatar_url: score.avatar_url,
      authored: score.authored,
      participated: score.participated
    }));

    scores = _map(scores, score => {
      score.score /= score.participated;
      return score;
    });

    scores = _pickBy(scores, score => score.score);

    // put it back together with the avatar
    const retVal = [];
    _forIn(scores, (value, key) => {
      retVal.push({ id: key, data: value, avatar_url: value.avatar_url });
    });

    return _orderBy(retVal, "data.score", "desc");
  }
}

module.exports = MergeStats;
