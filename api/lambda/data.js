'use strict';
var AWS = require('aws-sdk');
var uuid = require('uuid');
var dynamoDB = new AWS.DynamoDB();
var documentClient = new AWS.DynamoDB.DocumentClient();
var rfr = require('rfr');
var config = rfr('config');
let LambdaError = require('./errors');

class Table {
  /**
   * [constructor description]
   * @param  {[type]} tableParams is a passthrough parameter for DynamoDB table definition
   * @param  {[type]} options     Custom options, currently supports timestamps and uuid parameters
   * @return {[type]}             [description]
   */
  constructor(tableParams, options) {
    this.options = options || {};
    this.timestamps = this.options.timestamps || false;
    // For all fields in options.uuid an automatic UUID is generated for each PUT request
    this.uuid = this.options.uuid || [];
    this.tableParams = tableParams;
  }

  delete(key) {
    return new Promise((resolve, reject) => {
      documentClient.delete({
        TableName: this.tableParams.TableName,
        Key: key
      }, (err) => {
        if (err) {
          reject(LambdaError.deleteDataFailed(err));
        }
        resolve({});
      });
    })

  }

  get(key) {
    return new Promise((resolve, reject) => {
      documentClient.get({
        TableName: this.tableParams.TableName,
        Key: key
      }, (err, data) => {
        if (err || !data.Item) {
          console.log(err);
          reject(LambdaError.notFound(JSON.stringify(key)));
        } else {
          resolve(data.Item);
        }
      });
    });
  }

  scan() {
    return new Promise((resolve, reject) => {
      documentClient.scan({
        TableName: this.tableParams.TableName,
        ConsistentRead: true
      }, (err, data) => {
        if (err) {
          reject(LambdaError.internalError(err));
        } else {
          let items = [];
          if (data && data.Items) {
            items = data.Items;
          }
          resolve({ items });
        }
      });
    });
  }

  put(data) {
    for (var i=0;i<this.uuid.length;i++) {
      // If provided don't create an UUID on the property that is marked for auto uuid.
      data[this.uuid[i]] = data[this.uuid[i]] || uuid.v1();
    }
    if (this.timestamps) {
      if (data.createTime) {
        data.updateTime = new Date().toISOString();
      } else {
        data.createTime = new Date().toISOString();
      }
    }
    return new Promise((resolve, reject) => {
      documentClient.put({
        TableName: this.tableParams.TableName,
        Item: data
      }, (err) => {
        if (err) {
          console.error(err);
          reject(LambdaError.putDataFailed(err));
        } else {
          resolve(data);
        }
      });
    });
  }

  deleteTable() {
    return new Promise((resolve, reject) => {
      var params = {
        TableName: this.tableParams.TableName
      };
      dynamoDB.deleteTable(params, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log(`Table deleted: '${this.tableParams.TableName}'`);
        resolve();
      });
    });
  }

  createTable() {
    return new Promise((resolve, reject) => {
      dynamoDB.createTable(this.tableParams, (err) => {
        if (err) {
          reject(err);
          return;
        }
        console.log(`Table created: '${this.tableParams.TableName}'`);
        resolve();
      });
    });
  }

  safeCreateTable() {
    return new Promise((resolve, reject) => {
      dynamoDB.describeTable({
        TableName: this.tableParams.TableName,
      }, (err, data) => {
        if (err) {
          if (err.code === 'ResourceNotFoundException') {
            this.createTable()
            .then(data => {resolve(data);} )
            .catch(err => {reject(err); });
          } else {
            reject(err);
          }
        } else {
          // Need to update or return?
          console.log(`Table ${this.tableParams.TableName} already exists`);//, data);
          resolve(data);
        }
      });
    });
  }
}

class LocationsTable extends Table {
  constructor() {
    super({
      // Parametrization supported for the name so it can be user configured.
      TableName: config.getName('locations'),
      KeySchema: [{ AttributeName: 'locationId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'locationId', AttributeType: 'S' }],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    },
    // These are custom options that the Table class understands
    {
      // Which parameters are auto-generated with uuid.v1() which is time dependant.
      uuid: ['locationId'],
      // Whether to add timestamps to the entries.
      timestamps: true,
    });
  }

  delete(locationId) {
    return super.delete({locationId: locationId});
  }

  get(locationId) {
    return super.get({locationId: locationId});
  }

  update(locationId) {
    return super.put({locationId: locationId});
  }
}

class ResourcesTable extends Table {
  constructor() {
    super({
      // Parametrization supported for the name so it can be user configured.
        TableName: config.getName('resources'),
        KeySchema: [{ AttributeName: 'resourceId', KeyType: 'HASH' }],
      AttributeDefinitions: [
        { AttributeName: 'resourceId', AttributeType: 'S'},
        { AttributeName: 'locationId', AttributeType: 'S'}
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'locationIdGSI',
          KeySchema: [ { AttributeName: 'locationId', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    },
    // These are custom options that the Table class understands
    {
      // Which parameters are auto-generated with uuid.v1() which is time dependant.
      uuid: ['resourceId'],
      // Whether to add timestamps to the entries.
      timestamps: true,
    });
  }

  delete(resourceId) {
    return super.delete({resourceId: resourceId});
  }

  get(resourceId) {
    return super.get({resourceId: resourceId});
  }

  update(resourceId) {
    return super.put({resourceId: resourceId});
  }

  queryResourcesByLocationId(locationId) {
    return new Promise((resolve, reject) => {
      let params = {
        TableName: this.tableParams.TableName,
        IndexName: 'locationIdGSI',
        KeyConditionExpression: 'locationId = :locationId',
        ExpressionAttributeValues: {
          ':locationId': locationId,
        }
      };
      documentClient.query(params, (err, data) => {
        if (err || !data.Items) {
          reject(LambdaError.notFound(JSON.stringify(locationId)));
        } else {
          let items = data.Items;
          resolve({ items });
        }
      });
    });
  }
}

class BookingsTable extends Table {
  constructor() {
    super({
      // Parametrization supported for the name so it can be user configured.
      TableName: config.getName('bookings'),
      KeySchema: [ { AttributeName: 'bookingId', KeyType: 'HASH' }, ],
      AttributeDefinitions: [
        { AttributeName: 'bookingId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'resourceId', AttributeType: 'S' },
        { AttributeName: 'startTimeEpochTime', AttributeType: 'N' },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'userIdGSI',
          KeySchema: [ { AttributeName: 'userId', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        },
        {
          IndexName: 'bookingsByUserByTimeGSI',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'startTimeEpochTime', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        },
        {
          IndexName: 'bookingsByResourceByTimeGSI',
          KeySchema: [
            { AttributeName: 'resourceId', KeyType: 'HASH' },
            { AttributeName: 'startTimeEpochTime', KeyType: 'RANGE' },
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
          }
        }

      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    },
    // These are custom options that the Table class understands
    {
      // Which parameters are auto-generated with uuid.v1() which is time dependant.
      uuid: ['bookingId'],
      // Whether to add timestamps to the entries.
      timestamps: true,
    });
  }

  delete(bookingId) {
    return super.delete({
      bookingId: bookingId
    });
  }

  get(resourceId, startTime) {
    return super.get({
      resourceId: resourceId,
      startTime: startTime
    });
  }

  queryBookingsByResourceId(resourceId) {
    return new Promise((resolve, reject) => {
      let params = {
        TableName: this.tableParams.TableName,
        IndexName: 'bookingsByResourceByTimeGSI',
        KeyConditionExpression: 'resourceId = :resourceId',
        ExpressionAttributeValues: {
          ':resourceId': resourceId,
        }
      };
      documentClient.query(params, (err, data) => {
        if (err || !data.Items) {
          reject(LambdaError.notFound(JSON.stringify(resourceId)));
        } else {
          let items = data.Items;
          resolve({ items });
        }
      });
    });
  }

  queryBookingsByUserId(userId) {
    return new Promise((resolve, reject) => {
      let params = {
        TableName: this.tableParams.TableName,
        IndexName: 'userIdGSI',
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        }
      };
      documentClient.query(params, (err, data) => {
        if (err || !data.Items) {
          reject(LambdaError.notFound(JSON.stringify(userId)));
        } else {
          let items = data.Items;
          resolve({ items });
        }
      });
    });
  }

}

class ProfilesTable extends Table {
  constructor() {
    super({
      // Parametrization supported for the name so it can be user configured.
      TableName: config.getName('profiles'),
      KeySchema: [{ AttributeName: 'identityId', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'identityId', AttributeType: 'S' }],
      ProvisionedThroughput: {
        ReadCapacityUnits: 1,
        WriteCapacityUnits: 1
      }
    },
    // These are custom options that the Table class understands
    {
      // Which parameters are auto-generated with uuid.v1() which is time dependant.
      uuid: ['identityId'],
      // Whether to add timestamps to the entries.
      timestamps: true,
    });
  }

  delete(identityId) {
    return super.delete({identityId: identityId});
  }

  get(identityId) {
    return super.get({identityId: identityId});
  }

  update(identityId) {
    return super.put({identityId: identityId});
  }
}

module.exports = {
  LocationsTable,
  ResourcesTable,
  BookingsTable,
  ProfilesTable
};
