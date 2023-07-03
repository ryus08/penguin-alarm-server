/* eslint-disable class-methods-use-this */
/* eslint-disable camelcase */
const P = require("bluebird");
const AWS = require("aws-sdk");
const _map = require("lodash.map");
const _groupBy = require("lodash.groupby");

AWS.config.update({ region: "eu-west-1" });
AWS.config.setPromisesDependency(P);

const db = new AWS.DynamoDB.DocumentClient({ region: "eu-west-1" });
class DynamoClient {
  constructor(sub) {
    this.sub = sub;
  }

  getConfigs() {
    const params = {
      TableName: "PenguinConfig"
    };
    return db
      .scan(params)
      .promise()
      .then((result) => result.Items);
  }

  deleteConfig({ name }) {
    const params = {
      TableName: "PenguinConfig",
      Key: {
        name
      }
    };
    return db.delete(params).promise();
  }

  putConfig({ name, config }) {
    const params = {
      TableName: "PenguinConfig",
      Item: {
        name,
        config
      }
    };
    return db.put(params).promise();
  }

  getAllOpinions() {
    const params = {
      TableName: "PenguinOpinion"
    };
    return db
      .scan(params)
      .promise()
      .then((result) => result.Items);
  }

  getOpinions() {
    const params = {
      TableName: "PenguinOpinion",
      IndexName: "sub-index",
      // I hate dynamodb, why is sub = X so damned complex?
      KeyConditionExpression: "#sub = :sub",
      ExpressionAttributeNames: {
        "#sub": "sub"
      },
      ExpressionAttributeValues: {
        ":sub": this.sub
      }
    };

    return db
      .query(params)
      .promise()
      .then((result) => {
        const values = _map(result.Items, (item) => item.value);
        return _groupBy(values, "mergeId");
      });
  }

  putOpinion({ project_id, iid, mergeId, sick, configName }) {
    const params = {
      TableName: "PenguinOpinion",
      Item: {
        mergeIdSub: `${mergeId}-${this.sub}`,
        sub: this.sub,
        value: {
          sick,
          configName,
          project_id,
          iid,
          mergeId
        }
      }
    };
    return db.put(params).promise();
  }
}

module.exports = DynamoClient;
