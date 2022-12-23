/* eslint-disable camelcase */
const P = require("bluebird");
const AWS = require("aws-sdk");
const _map = require("lodash.map");
const _groupBy = require("lodash.groupby");

class DynamoClient {
  constructor() {
    AWS.config.update({ region: "eu-west-1" });
    AWS.config.setPromisesDependency(P);
    this.db = new AWS.DynamoDB.DocumentClient({ region: "eu-west-1" });
  }

  getConfigs() {
    const params = {
      TableName: "PenguinConfig"
    };
    return this.db
      .scan(params)
      .promise()
      .then(result => result.Items);
  }

  deleteConfig({ name }) {
    const params = {
      TableName: "PenguinConfig",
      Key: {
        name
      }
    };
    return this.db.delete(params).promise();
  }

  putConfig({ name, config }) {
    const params = {
      TableName: "PenguinConfig",
      Item: {
        name,
        config
      }
    };
    return this.db.put(params).promise();
  }

  getAllOpinions() {
    const params = {
      TableName: "PenguinOpinion"
    };
    return this.db
      .scan(params)
      .promise()
      .then(result => result.Items);
  }

  getOpinions({ sub }) {
    const params = {
      TableName: "PenguinOpinion",
      IndexName: "sub-index",
      // I hate dynamodb, why is sub = X so damned complex?
      KeyConditionExpression: "#sub = :sub",
      ExpressionAttributeNames: {
        "#sub": "sub"
      },
      ExpressionAttributeValues: {
        ":sub": sub
      }
    };

    return this.db
      .query(params)
      .promise()
      .then(result => {
        const values = _map(result.Items, item => item.value);
        return _groupBy(values, "mergeId");
      });
  }

  putOpinion({ sub, project_id, iid, mergeId, sick, configName }) {
    const params = {
      TableName: "PenguinOpinion",
      Item: {
        mergeIdSub: `${mergeId}-${sub}`,
        sub,
        value: {
          sick,
          configName,
          project_id,
          iid,
          mergeId
        }
      }
    };
    return this.db.put(params).promise();
  }
}

const dynamoClient = new DynamoClient();

module.exports = dynamoClient;
