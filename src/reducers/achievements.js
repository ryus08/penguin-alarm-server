const _intersectionWith = require("lodash.intersectionwith");
const _filter = require("lodash.filter");
const _map = require("lodash.map");
const _get = require("lodash.get");
const config = require("config");
const activityQuery = require("./activityquery");
const groupData = require("../data/groupdata");
const dateUtil = require("../util/date");
const dailyStats = require("./dailystats");

module.exports = ({ merges }) => {
  const getDateIndex = (dateTime) => 28 - dateUtil.dateDiff(dateTime);

  const approvals = activityQuery({ merges, type: "approvals" });
  const comments = activityQuery({ merges, type: "comments" });
  const merged = activityQuery({ merges, type: "merges" });
  const created = activityQuery({ merges, type: "created" });

  const userMap = (dataSet) =>
    _map(dataSet, (record) => {
      record.author = record.user.author;
      record.avatar = record.user.avatar;
      record.name = record.user.name;
      return record;
    });

  const givingBack = () => {
    const fiMerges = _get(groupData.get({ groupId: 121 }), "merges");
    const relevantMerges = _filter(
      fiMerges,
      (merge) =>
        merge.projectName === "penguin-alarm" ||
        merge.projectName === "penguin-server"
    );

    const formatted = _map(relevantMerges, (merge) => ({
      user: {
        author: merge.author.id,
        username: merge.author.username,
        avatar: merge.author.avatar_url,
        name: merge.author.name
      },
      dateIndex: getDateIndex(merge.created_at)
    }));

    return dailyStats.latestPerUser(formatted);
  };

  const tripleDouble = () => {
    const comparator = (item1, item2) =>
      item1.dateIndex === item2.dateIndex &&
      item1.user.author === item2.user.author &&
      item1.count >= 2 &&
      item2.count >= 2;

    return _intersectionWith(approvals, comments, merged, comparator);
  };

  const beastMode = () => _filter(comments, (comment) => comment.count >= 10);

  const approveThisMessage = () =>
    _filter(approvals, (approval) => approval.count >= 5);

  const jamesJoyce = () => _filter(created, (counts) => counts.count >= 5);

  const quickDraw = () =>
    _filter(
      activityQuery({ merges, type: "quick" }),
      (counts) => counts.count >= 1
    );

  const tooSoon = () =>
    _filter(
      activityQuery({ merges, type: "tooSoon" }),
      (counts) => counts.count >= 1
    );

  const breakinTheLaw = () =>
    dailyStats.dailyCount({ merges, reduction: dailyStats.mergedNoApproval });

  return [
    {
      winners: userMap(tripleDouble()),
      name: "Triple Double",
      rule: "2+ comments / 2+ approvals / 2+ merges",
      image: `${config.selfUrl}/westbrook.jpg`
    },
    {
      winners: userMap(beastMode()),
      name: "Beast Mode",
      rule: "10+ comments",
      image: `${config.selfUrl}/hulk.jpg`
    },
    {
      winners: userMap(approveThisMessage()),
      name: "I Approve This Message",
      rule: "5+ approvals",
      image: `${config.selfUrl}/burgundy.jpg`
    },
    {
      winners: userMap(jamesJoyce()),
      name: "James Joyce Award",
      rule: "5+ merge requests",
      image: `${config.selfUrl}/ulysses.jpg`
    },
    {
      winners: userMap(quickDraw()),
      name: "Quick Draw",
      rule: "Open and merge a request within 5 minutes",
      image: `${config.selfUrl}/draw.jpg`
    },
    {
      winners: userMap(tooSoon()),
      name: "Too Soon?",
      rule: "5+ comments made after your approval",
      image: `${config.selfUrl}/truman.jpg`
    },
    {
      winners: givingBack() || [],
      name: "Giving Back",
      rule: "Make a penguin contribution",
      image: `${config.selfUrl}/babypenguin.jpg`
    },
    {
      winners: breakinTheLaw() || [],
      name: "Breakin the Law!",
      rule: "Merge without approvals",
      image: `${config.selfUrl}/breakinthelaw.jpg`
    }
  ];
};
