'use strict';
var rfr = require('rfr');
var locations = rfr('lambda/locations');
var chai = require('chai');
var expect = chai.expect;
/* jshint -W024 */
/* jshint expr:true */
describe('Create Get Update Delete', function() {
  
  before((done) => {
    locations.Create({
      body: JSON.stringify({
        name: 'Location1',
        description: 'My description'
      })},
      {
        // Empty context object for testing purposes
      },
      // Callback anonymous function for Lambda Node 4.3 runtime
      (err, out) => {
        let data = JSON.parse(out.body);
        expect(err).to.not.exist;
        expect(data.name).to.be.eql('Location1');
        expect(data.locationId).to.exist;
        this.locationId = data.locationId;
        done();
      }
    );
  });
  it('Get and Update value', (done) => {
    locations.Get(
      {pathParameters: {locationId: this.locationId}},
      {
        // Empty context object for testing purposes
      },
      (err, out) => {
        let data = JSON.parse(out.body);
        expect(err).to.not.exist;
        expect(data.locationId).to.be.eql(this.locationId);
        expect(data.name).to.be.eql('Location1');
        locations.Update({
          pathParameters: { locationId: this.locationId },
          body: JSON.stringify({
            name: 'Location1-Renamed'
          })
        }, {}, (err, out) => {
          expect(err).to.not.exist;
          let data = JSON.parse(out.body);
          expect(data.updateTime).to.exist;
          expect(data.name).to.be.eql('Location1-Renamed');
          done();
        })
      }
    );
  });
  after((done) => {
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
  });
});

describe('Locations Not Found', function() {
  it('Get 404', (done) => {
    locations.Get({
        pathParameters: {locationId: 'something'}
      },
      {
        // Empty context object for testing purposes
      },
      (err, out) => {
        console.log(out);
        expect(err).to.not.exist;
        expect(out.statusCode).to.be.eql(404);
        done();
      });
  });

  it('Update 404', (done) => {
    locations.Update({
        pathParameters: {locationId: 'something'},
        body: JSON.stringify({name : 'foo'})
      },
      {
        // Empty context object for testing purposes
      },
      (err, out) => {
        console.log(out);
        expect(err).to.not.exist;
        expect(out.statusCode).to.be.eql(404);
        done();
      });
  });

  it('Delete 404', (done) => {
    locations.Delete({
        pathParameters: {locationId: 'something'},
      },
      {
        // Empty context object for testing purposes
      },
      (err, out) => {
        console.log(out);
        expect(err).to.not.exist;
        expect(out.statusCode).to.be.eql(404);
        done();
      });
  });
});