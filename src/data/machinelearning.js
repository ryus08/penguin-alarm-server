/* eslint-disable camelcase */
const AWS = require("aws-sdk");
const P = require("bluebird");

const s3 = new AWS.S3();
const _mapValues = require("lodash.mapvalues");
const jsonexport = P.promisify(require("jsonexport"));
const _map = require("lodash.map");
const uuid = require("uuid/v4");
const PredictionCache = require("./predictioncache");

const machinelearning = new AWS.MachineLearning({
  apiVersion: "2014-12-12",
  region: "eu-west-1"
});

const predictEndpoint =
  "https://realtime.machinelearning.eu-west-1.amazonaws.com";

const bucket = "penguin.models";

const predictionCache = new PredictionCache();

class MachineLearning {
  constructor({ statsFetch, reducer, modelId }) {
    this.statsFetch = statsFetch;
    this.reducer = reducer;
    this.modelId = modelId;
  }

  predict({ merge }) {
    const predictionFromStats = ({ stats, project_id, iid }) => {
      const params = {
        MLModelId: this.modelId,
        PredictEndpoint: predictEndpoint,
        // AWS wants them all as strings for some reason
        Record: _mapValues(stats, value => value.toString())
      };

      return machinelearning
        .predict(params)
        .promise()
        .then(prediction => {
          predictionCache.set({
            project_id,
            iid,
            prediction
          });
          return prediction;
        });
    };

    return predictionCache
      .get({
        project_id: merge.project_id,
        iid: merge.iid,
        missStatsPromise: () =>
          predictionFromStats({
            stats: this.reducer({ merge }),
            project_id: merge.project_id,
            iid: merge.iid
          })
      })
      .then(prediction => {
        // backward compatible with the old multi-class model
        if (prediction.Prediction.details.PredictiveModelType === "BINARY") {
          prediction.Prediction.predictedLabel =
            prediction.Prediction.predictedLabel === "0" ? "good" : "bad";
        }

        return prediction;
      });
  }

  createDataSource({ sourceData, s3FileName, training = true }) {
    const schema = training ? "dataschema.json" : "predictionschema.json";

    // go grab whatever data we need
    return (
      this.statsFetch(sourceData)
        // turn it into a csv
        .then(data => jsonexport(data))
        // then put it into s3
        .then(csv =>
          s3
            .putObject({
              Bucket: bucket,
              Key: s3FileName,
              Body: csv,
              ACL: "public-read"
            })
            .promise()
        )
        .then(() => {
          const params = {
            ComputeStatistics: training,
            DataSourceId: s3FileName,
            DataSpec: {
              DataLocationS3: `s3://${bucket}/${s3FileName}`,
              DataSchemaLocationS3: `s3://${bucket}/${schema}`
            },
            DataSourceName: s3FileName
          };
          return machinelearning.createDataSourceFromS3(params).promise();
        })
    );
  }

  createModel({ sourceData, s3FileName }) {
    // jscs:disable maximumLineLength
    return this.createDataSource({ sourceData, s3FileName }).then(dataSource =>
      machinelearning
        .createMLModel({
          MLModelId: `ml-${uuid()}`,
          MLModelType: "BINARY",
          TrainingDataSourceId: dataSource.DataSourceId,
          MLModelName: "MergeRequestOpinions",
          Recipe:
            '{\r\n  "groups" : {\r\n              "NUMERIC_VARS_QB_20" : "group(\'approvalTime\',\'mergeTime\')",\r\n              "NUMERIC_VARS_QB_10" : "group(\'comments\',\'changes\')"\r\n            },\r\n            "assignments" : { },\r\n            "outputs" : [ "ALL_CATEGORICAL", "quantile_bin(NUMERIC_VARS_QB_20,20)", "quantile_bin(NUMERIC_VARS_QB_10,10)" ]\r\n}'
        })
        .promise()
    );
    // jscs:enable maximumLineLength
  }

  getModels() {
    return machinelearning
      .describeMLModels({})
      .promise()
      .then(models =>
        _map(models.Results, model => ({
          id: model.MLModelId,
          active: model.MLModelId === this.modelId,
          status: model.Status
        }))
      );
  }

  setActiveModel(modelId) {
    // no change in state, leave things alone
    if (modelId === this.modelId) {
      return P.resolve();
    }

    // create the new endpoint
    return (
      machinelearning
        .createRealtimeEndpoint({ MLModelId: modelId })
        .promise()
        // turn off the old one
        .tap(() =>
          machinelearning
            .deleteRealtimeEndpoint({ MLModelId: this.modelId })
            .promise()
        )
        // keep the change
        .then(() => {
          this.modelId = modelId;
        })
    );
  }
}

module.exports = MachineLearning;
