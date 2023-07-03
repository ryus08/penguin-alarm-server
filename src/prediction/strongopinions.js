const _groupBy = require("lodash.groupby");
const _maxBy = require("lodash.maxby");
const _map = require("lodash.map");
const _filter = require("lodash.filter");

module.exports = ({
  minimumAgreementPct = 0.75,
  minimumSupport = 1,
  allOpinions
}) =>
  Promise.resolve(allOpinions).then((opinions) => {
    // pull all the data together by merge request
    const grouped = _groupBy(opinions, "value.mergeId");

    // then pick out the strong data points
    const dataPoints = _map(grouped, (value) => {
      // then get all the sickness values
      const sicknesses = _map(value, "value.sick");

      // figure out each sickness type's percentage vote
      const sicknessPercents = _map(_groupBy(sicknesses), (v, key) => ({
        sickness: key,
        percentage: v.length / sicknesses.length,
        total: v.length
      }));

      const retVal = {
        project_id: value[0].value.project_id,
        iid: value[0].value.iid
      };

      // determine what the most common response was
      const highestVote = _maxBy(sicknessPercents, "percentage");

      // if it was a strong enough signal, then we can record it as such
      if (
        highestVote.percentage > minimumAgreementPct &&
        highestVote.sickness !== "neither"
      ) {
        retVal.concensus = highestVote.sickness;
        retVal.supporters = highestVote.total;
      }

      return retVal;
    });
    return _filter(dataPoints, (data) => data.supporters >= minimumSupport);
  });
