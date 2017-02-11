'use strict';
var rfr = require('rfr');
var logger = rfr('util/logger');
var locations = rfr('lambda/locations');
var resources = rfr('lambda/resources');
var bookings = rfr('lambda/bookings');
var cognito = rfr('util/cognito');

/*
 More information about the UserGroups and the precedence
 http://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-user-groups.html#assigning-precedence-values-to-groups
 */

var SampleGroups = [
  {
    name: 'adminGroup',
    description: 'Cognito user group for administrators',
    precedence: 0,
    roleArn: 'cognitoAuthAdminRoleArn'
  },
  {
    name: 'clientGroup',
    description: 'Cognito user group for spacefinder users',
    precedence: 1,
    roleArn: 'cognitoAuthStandardRoleArn'
  },
];


var SampleUsers = [
  {
    username: 'admin1',
    email: 'admin@example.com',
    givenName: 'Admin',
    familyName: 'User',
    password: 'Test123!'

  },
  {
    username: 'user1',
    email: 'user1@example.com',
    givenName: 'Sample',
    familyName: 'User',
    password: 'Test123!'
  }
];

class SampleData {

  constructor() {
    this.timeMappings = {
      "6am - 7am": {start: "T06:00:00.000Z", end: "T07:00:00.000Z"},
      "7am - 8am": {start: "T07:00:00.000Z", end: "T08:00:00.000Z"},
      "8am - 9am": {start: "T08:00:00.000Z", end: "T09:00:00.000Z"},
      "9am - 10am": {start: "T09:00:00.000Z", end: "T10:00:00.000Z"},
      "10am - 11am": {start: "T10:00:00.000Z", end: "T11:00:00.000Z"},
      "11am - noon": {start: "T11:00:00.000Z", end: "T12:00:00.000Z"},
      "noon - 1pm": {start: "T12:00:00.000Z", end: "T13:00:00.000Z"},
      "1pm - 2pm": {start: "T13:00:00.000Z", end: "T14:00:00.000Z"},
      "2pm - 3pm": {start: "T14:00:00.000Z", end: "T15:00:00.000Z"},
      "3pm - 4pm": {start: "T15:00:00.000Z", end: "T16:00:00.000Z"},
      "4pm - 5pm": {start: "T16:00:00.000Z", end: "T17:00:00.000Z"},
      "5pm - 6pm": {start: "T17:00:00.000Z", end: "T18:00:00.000Z"},
      "6pm - 7pm": {start: "T18:00:00.000Z", end: "T19:00:00.000Z"},
      "7pm - 8pm": {start: "T19:00:00.000Z", end: "T20:00:00.000Z"},
      "8pm - 9pm": {start: "T20:00:00.000Z", end: "T21:00:00.000Z"},
    }
  }

  generateSampleData() {
    return Promise.all([
      // Venetian
      this.generateSampleLocation('The Venetian', 'Las Vegas',
        'https://s3.amazonaws.com/spacefinder-public-image-repository/venetian.jpg')
        .then(locationId => {
          this.generateSampleResource('Toscana 3606, Room 6', 'Venetian Level 3', locationId, 'room');
          this.generateSampleResource('Titian 2205', 'Venetian Level 2', locationId, 'room');
          this.generateSampleResource('Opaline Theater', 'Venetian Level 2', locationId, 'room');
          // this.generateSampleResource('Delfino 4004', 'Venetian Level 4', locationId, 'desk');
        }),
      // Encore
      this.generateSampleLocation('Encore', 'Las Vegas',
        'https://s3.amazonaws.com/spacefinder-public-image-repository/encore.jpg')
        .then(locationId => {
          this.generateSampleResource('Beethoven', 'Seats 1163', locationId, 'room');
          this.generateSampleResource('Brahms', 'Seats 809', locationId, 'room');
          this.generateSampleResource('Chopin', 'Seats 741', locationId, 'room');
          this.generateSampleResource('Desk 1', 'Comfortable desk', locationId, 'desk');
        }),
      // Mirage
      this.generateSampleLocation('The Mirage', 'Las Vegas',
        'https://s3.amazonaws.com/spacefinder-public-image-repository/mirage.jpg')
        .then(locationId => {
          this.generateSampleResource('Bermuda A', 'Dual screen projectors', locationId, 'room');
          this.generateSampleResource('Jamaica B', 'Large room', locationId, 'room');
          this.generateSampleResource('Martinique A', 'Large room', locationId, 'room');
          this.generateSampleResource('Desk 1', 'Mahogany desk', locationId, 'desk')
          /*
           .then(resourceId => {
           this.generateSampleBooking(locationId, 'The Palazzo', 'Palazzo Desk 1', 'Mahogany desk',
           resourceId, new Date(2016, 11, 27), '9am - 10am', 'user1', 'Jim', 'Tran');
           this.generateSampleBooking(locationId, 'The Palazzo', 'Palazzo Desk 1', 'Mahogany desk',
           resourceId, new Date(2016, 11, 27), '10am - 11am', 'user2', 'Justin', 'Pirtle');
           })
           */
        })
    ]);
  }

  generateSampleLocation(name, description, imageUrl) {
    return new Promise((resolve, reject) => {

      locations.Create({
          body: JSON.stringify({
            name: name,
            description: description,
            imageUrl: imageUrl,
          })
        },
        {/* Empty context object */},
        (err, out) => {
          if (err !== null) {
            reject(err);
          } else {
            // return the locationId
            let data = JSON.parse(out.body);
            resolve(data.locationId);
          }
        }
      );
    });
  }

  generateSampleResource(name, description, locationId, type) {
    return new Promise((resolve, reject) => {
      resources.Create(
        {
          body: JSON.stringify({
            name: name,
            locationId: locationId,
            description: description,
            type: type
          }),
        },
        {/* Empty context object */},
        (err, out) => {
          if (err !== null) {
            reject(err);
          } else {
            // return the resourceId
            let data = JSON.parse(out.body);
            resolve(data.resourceId);
          }
        }
      );
    });
  }

  generateSampleBooking(locationId, locationName, resourceName, resourceDescription,
                        resourceId, date, timeslot, userId, userFirstName, userLastName) {
    return new Promise((resolve, reject) => {

      // Date string manipulation to calculate the startTime and endTime values, based on the timeslot
      let startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      let dummyDate = new Date(Date.parse('2016-01-01' + this.timeMappings[timeslot].start));
      startTime.setHours(dummyDate.getHours());

      let endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      dummyDate = new Date(Date.parse('2016-01-01' + this.timeMappings[timeslot].end));
      endTime.setHours(dummyDate.getHours());

      bookings.Create(
        {
          body: JSON.stringify({
            locationId: locationId,
            locationName: locationName,
            resourceName: resourceName,
            resourceDescription: resourceDescription,
            resourceId: resourceId,
            startTimeIsoTimestamp: startTime.toISOString(),
            startTimeEpochTime: startTime.getTime(),
            endTimeIsoTimestamp: endTime.toISOString(),
            endTimeEpochTime: endTime.getTime(),
            timeslot: timeslot,
            userId: userId,
            userFirstName: userFirstName,
            userLastName: userLastName
          }),
        },
        {/* Empty context object */},
        (err, out) => {
          if (err !== null) {
            reject(err);
          } else {
            resolve(out);
          }
        }
      );
    });
  }


  static createPromiseToCreateUser(user) {
    let promise = new Promise((resolve, reject) => {
      cognito.adminCreateUser(user)
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
    return promise;
  }

  static generateSampleUsers() {
    let promises = [];
    for (let user of SampleUsers) {
      // create a Promise for each user creation task
      let promise = SampleData.createPromiseToCreateUser(user);
      promises.push(promise);
    }
    // now, run all those Promises in parallel
    return Promise.all(promises);
  }

  //TODO: Update following method to accept a particular username or user details object and lookup their corresponding user identity pools Id
  static getSampleUser() {
    return new Promise((resolve) => {
      let user = SampleUsers[1];
      cognito.getIdentityPoolUserId(user).then((data) => {
        // logger.info(data);
        resolve(data);
      });
    });
  }

  static createPromiseToCreateGroup(group) {
    let promise = new Promise((resolve, reject) => {
      cognito.adminCreateGroup(group)
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
    return promise;
  }

  static generateSampleUserGroups() {
    let promises = [];
    for (let group of SampleGroups) {
      let promise = SampleData.createPromiseToCreateGroup(group);
      promises.push(promise);
    }
    return Promise.all(promises);
  }


  static createUserAssignmentToGroupPromise(user, group) {
    let promise = new Promise((resolve, reject) => {
      cognito.adminAssignUserToGroup(user, group)
        .then((data) => {
          resolve(data);
        })
        .catch((err) => {
          reject(err);
        });
    });
    return promise;
  }


  static assignUsersToGroups() {
    let promises = [];
    for (let user of SampleUsers) {
      let group = null;

      if (user.username === "admin1") {
        group = SampleGroups[0];
      } else {
        group = SampleGroups[1];
      }
      let promise = SampleData.createUserAssignmentToGroupPromise(user, group);
      promises.push(promise);
    }
    logger.info(promises.length);
    return Promise.all(promises);


  }


} // end class

module
  .exports = {
  SampleData
};
