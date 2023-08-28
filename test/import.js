const { describe, it } = require('node:test');
const should = require('should');
const fs = require('fs');
const parse = require('..');

describe('GPX import', function () {
  it('parser imported gpx single stop', function (t, done) {
    const stream = fs.createReadStream(__dirname + '/fixtures/single-stop.gpx');
    parse(stream, function (err, trip) {
      const expected = require('./fixtures/single-stop.json');
      should.not.exist(err);
      should.exist(trip);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported gpx route', function (t, done) {
    const stream = fs.createReadStream(__dirname + '/fixtures/usa-route.gpx');
    parse(stream, function (err, trip) {
      const expected = require('./fixtures/usa-route.json');
      // require('fs').writeFileSync('usa-route.json', JSON.stringify(trip, null, 2));
      should.exist(trip);
      should.not.exist(err);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported gpx stops', function (t, done) {
    const stream = fs.createReadStream(__dirname + '/fixtures/usa-stops.gpx');
    parse(stream, function (err, trip) {
      const expected = require('./fixtures/usa-stops.json');
      should.exist(trip);
      should.not.exist(err);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported gpx track', function (t, done) {
    const stream = fs.createReadStream(__dirname + '/fixtures/usa-track.gpx');
    parse(stream, function (err, trip) {
      const expected = require('./fixtures/usa-track.json');
      should.exist(trip);
      should.not.exist(err);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported garmin route point extension', function (t, done) {
    const stream = fs.createReadStream(__dirname + '/fixtures/rpt-ext.gpx');
    parse(stream, function (err, trip) {
      const expected = require('./fixtures/rpt-ext.json');
      should.not.exist(err);
      should.exist(trip);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported garmin color track', function (t, done) {
    const stream = fs.createReadStream(__dirname + '/fixtures/color-garmin.gpx');
    parse(stream, function (err, trip) {
      const expected = require('./fixtures/color-garmin.json');
      should.exist(trip);
      should.not.exist(err);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported guru color track', function (t, done) {
    const stream = fs.createReadStream(__dirname + '/fixtures/color-guru.gpx');
    parse(stream, function (err, trip) {
      const expected = require('./fixtures/color-guru.json');
      should.exist(trip);
      should.not.exist(err);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported gpx link', function (t, done) {
    const stream = fs.createReadStream(__dirname + '/fixtures/with-link.gpx');
    parse(stream, function (err, trip) {
      const expected = require('./fixtures/with-link.json');
      should.not.exist(err);
      should.exist(trip);
      trip.should.eql(expected);
      done();
    });
  });

  it('empty GPX', function (t, done) {
    const stream = fs.createReadStream(__dirname + '/fixtures/empty.gpx');
    parse(stream, function (err, trip) {
      should.not.exist(err);
      trip.should.eql({
        destination: 'empty'
      });
      done();
    });
  });

  it('should raise error on invalid XML file', function (t, done) {
    const stream = fs.createReadStream(__dirname + '/fixtures/invalid.gpx');
    parse(stream, function (err, trip) {
      should.exist(err);
      err.should.have.property('err', 'invalid');
      err.should.have.property('message');
      should.not.exist(trip);
      done();
    });
  });
});
