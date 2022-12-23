const dailyStats = require("./dailystats");

module.exports = ({ merges, type }) =>
  dailyStats.dailyCount({ merges, reduction: dailyStats[type] });
