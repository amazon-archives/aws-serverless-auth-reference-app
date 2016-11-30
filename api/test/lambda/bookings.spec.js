'use strict';
var rfr = require('rfr');
var locations = rfr('lambda/locations');
var resources = rfr('lambda/resources');
var bookings = rfr('lambda/bookings');
var chai = require('chai');
var expect = chai.expect;
/* jshint -W024 */
/* jshint expr:true */

const SAMPLE_USER_ID = 'userId-123'

describe('Create Get Update Delete', function() {
  this.timeout(5000);
  
  before((done) => {

    // first, create a sample location
    console.log("Creating location");
    locations.Create({
      body: JSON.stringify({
        name: 'LocationX',
        description: 'Location with ResourceX',
      })},
      {
        // Empty context object for testing purposes
      },
      // Callback anonymous function for Lambda Node 4.3 runtime
      (err, out) => {
        let data = JSON.parse(out.body);
        expect(err).to.not.exist;
        expect(data.name).to.be.eql('LocationX');
        expect(data.locationId).to.exist;
        this.locationId = data.locationId;

        // now, attach the resource to the location
        console.log("Creating resource");
        resources.Create(
          {
            body: JSON.stringify({
              name: 'MyResource',
              description: 'My resource description',
              type: 'room',
            }),
            pathParameters: {
              locationId: this.locationId,
            }
          },
          {
            // Empty context object for testing purposes
          },
          // Callback anonymous function for Lambda Node 4.3 runtime
          (err, out) => {
            let data = JSON.parse(out.body);
            expect(err).to.not.exist;
            expect(data.name).to.be.eql('MyResource');
            expect(data.resourceId).to.exist;
            this.resourceId = data.resourceId;
            
            // create booking #1
            console.log("Creating booking #1");
            bookings.Create(
              {
                body: JSON.stringify({
                  startTime: new Date(2016, 11, 26, 5).toISOString(),
                  endTime: new Date(2016, 11, 26, 6).toISOString(),
                  name: 'MyBooking1',
                  userId: SAMPLE_USER_ID,
                }),
                pathParameters: {
                  resourceId: this.resourceId,
                }
              },
              {
                // Empty context object for testing purposes
              },
              // Callback anonymous function for Lambda Node 4.3 runtime
              (err, out) => {
                let data = JSON.parse(out.body);
                expect(err).to.not.exist;
                expect(data.bookingId).to.exist;
                expect(data.name).to.be.eql('MyBooking1');
                this.bookingId1 = data.bookingId;
                
                // create booking #2
                console.log("Creating booking #2");
                bookings.Create(
                  {
                    body: JSON.stringify({
                      startTime: new Date(2016, 11, 26, 6).toISOString(),
                      endTime: new Date(2016, 11, 26, 7).toISOString(),
                      name: 'MyBooking2',
                      userId: SAMPLE_USER_ID,
                    }),
                    pathParameters: {
                      resourceId: this.resourceId,
                    }
                  },
                  {
                    // Empty context object for testing purposes
                  },
                  // Callback anonymous function for Lambda Node 4.3 runtime
                  (err, out) => {
                    let data = JSON.parse(out.body);
                    expect(err).to.not.exist;
                    expect(data.bookingId).to.exist;
                    expect(data.name).to.be.eql('MyBooking2');
                    this.bookingId2 = data.bookingId;
                    
                    // create booking #3
                    console.log("Creating booking #3");
                    bookings.Create({
                      body: JSON.stringify({
                        startTime: new Date(2016, 11, 26, 7).toISOString(),
                        endTime: new Date(2016, 11, 26, 8).toISOString(),
                        name: 'MyBooking3',
                        userId: "Some-other-userID",
                        }),
                        pathParameters: {
                          resourceId: this.resourceId,
                        }
                      },
                      {
                        // Empty context object for testing purposes
                      },
                      // Callback anonymous function for Lambda Node 4.3 runtime
                      (err, out) => {
                        let data = JSON.parse(out.body);
                        expect(err).to.not.exist;
                        expect(data.bookingId).to.exist;
                        expect(data.name).to.be.eql('MyBooking3');
                        this.bookingId3 = data.bookingId;
                        done();
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
  it('Query bookings by resourceId', (done) => {
    bookings.ListByResourceId(
      {
        pathParameters: {
          resourceId: this.resourceId,
        }
      },
      {
        // Empty context object for testing purposes
      },
      (err, out) => {
        let data = JSON.parse(out.body);
        expect(err).to.not.exist;
        console.log(data);
        done();
      }
    );
  });

  it('Query bookings by userId', (done) => {
    bookings.ListByUserId(
      {
        pathParameters: {
          userId: SAMPLE_USER_ID,
        }
      },
      {
        // Empty context object for testing purposes
      },
      (err, out) => {
        let data = JSON.parse(out.body);
        expect(err).to.not.exist;
        console.log(data);
        done();
      }
    );
  });

  after((done) => {

    console.log("Deleting booking1");
    // delete the bookings
    bookings.Delete(
    {
        pathParameters: { bookingId: this.bookingId1 }
    },
    {
      // Empty context object for testing
    },
    (err, data) => {
        console.log(JSON.stringify(err, null, 4));
        expect(err).to.not.exist;
        expect(JSON.parse(data.body)).to.be.eql({});

        console.log("Deleting booking2");
        // delete the bookings
        bookings.Delete(
        {
          pathParameters: { bookingId: this.bookingId2 }
        },
        {
          // Empty context object for testing
        },
        (err, data) => {
            console.log(JSON.stringify(err, null, 4));
            expect(err).to.not.exist;
            expect(JSON.parse(data.body)).to.be.eql({});

            console.log("Deleting booking3");
            // delete the bookings
            bookings.Delete(
            {
                pathParameters: { bookingId: this.bookingId3 }
            },
            {
              // Empty context object for testing
            },
            (err, data) => {
                console.log(JSON.stringify(err, null, 4));
                expect(err).to.not.exist;
                expect(JSON.parse(data.body)).to.be.eql({});

                // delete the resource
                resources.Delete(
                  {
                    pathParameters:{ resourceId: this.resourceId }
                  },
                  {
                    // Empty context object for testing
                  },
                  (err, data) => {
                    console.log(JSON.stringify(err, null, 4));
                    expect(err).to.not.exist;
                    expect(JSON.parse(data.body)).to.be.eql({});

                    // delete the location
                    locations.Delete(
                      {
                        pathParameters:{ locationId: this.locationId }
                      },
                      {
                        // Empty context object for testing
                      },
                      (err, data) => {
                        console.log(JSON.stringify(err, null, 4));
                        expect(err).to.not.exist;
                        expect(JSON.parse(data.body)).to.be.eql({});
                        done();
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});
