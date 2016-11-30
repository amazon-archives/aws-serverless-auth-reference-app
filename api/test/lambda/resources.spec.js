'use strict';
var rfr = require('rfr');
var locations = rfr('lambda/locations');
var resources = rfr('lambda/resources');
var chai = require('chai');
var expect = chai.expect;
/* jshint -W024 */
/* jshint expr:true */
describe('Create Get Update Delete', function() {

  before((done) => {
    // first, create a sample location
    locations.Create(
      {
        body: JSON.stringify({
          name: 'LocationX',
          description: 'Location with ResourceX',
        }),
        pathParameters: { locationId: this.locationId },
      },
      {
        // Empty context object for testing purposes
      },
      // Callback anonymous function for Lambda Node 4.3 runtime
      (err, out) => {
        let data = JSON.parse(out.body);
        console.log(err);
        expect(err).to.not.exist;
        expect(data.name).to.be.eql('LocationX');
        expect(data.locationId).to.exist;
        this.locationId = data.locationId;

        // now, attach the resource to the location
        resources.Create(
          {
            body: JSON.stringify({
              name: 'MyResource',
              description: 'My resource description',
              locationId: this.locationId,
              type: 'room',
            }),
            pathParameters: { locationId: this.locationId },
          },
          {
            // Empty context object for testing purposes
          },
          // Callback anonymous function for Lambda Node 4.3 runtime
          (err, out) => {
            let data = JSON.parse(out.body);
            console.log(err);
            expect(err).to.not.exist;
            expect(data.name).to.be.eql('MyResource');
            expect(data.resourceId).to.exist;
            this.resourceId = data.resourceId;
            done();
          }
        );
      }
    );
  });
  it('Get and Update value', (done) => {
    resources.Get(
      {pathParameters: {resourceId: this.resourceId}},
      {
        // Empty context object for testing purposes
      },
      (err, out) => {
        let data = JSON.parse(out.body);
        expect(err).to.not.exist;
        expect(data.resourceId).to.be.eql(this.resourceId);
        expect(data.name).to.be.eql('MyResource');
        resources.Update({
          pathParameters: { resourceId: this.resourceId },
          body: JSON.stringify({
            name: 'MyResource-renamed',
            description: data.description,
            locationId: data.locationId,
            type: data.type 
          })
        }, {}, (err, out) => {
          expect(err).to.not.exist;
          let data = JSON.parse(out.body);
          expect(data.updateTime).to.exist;
          expect(data.name).to.be.eql('MyResource-renamed');
          done();
        })
      }
    );
  });

  it('List resources by locationId', (done) => {
    resources.List(
      {pathParameters: {resourceId: this.locationId}},
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
  });
});

describe('Resources Not Found', function() {
  it('Get 404', (done) => {
    resources.Get({
        pathParameters: {resourceId: 'something'}
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
    resources.Update({
        pathParameters: {resourceId: 'something'},
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
    resources.Delete({
        pathParameters: {resourceId: 'something'},
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