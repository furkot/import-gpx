var should = require('should');
var fs = require('fs');
var parse = require('..');

describe('GPX import', function() {
  it('parser imported gpx single stop', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/single-stop.gpx');
    parse(stream, function(err, trip) {
      var expected = require('./fixtures/single-stop.json');
      should.not.exist(err);
      should.exist(trip);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported gpx route', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/usa-route.gpx');
    parse(stream, function(err, trip) {
      var expected = require('./fixtures/usa-route.json');
      // require('fs').writeFileSync('usa-route.json', JSON.stringify(trip, null, 2));
      should.exist(trip);
      should.not.exist(err);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported gpx stops', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/usa-stops.gpx');
    parse(stream, function(err, trip) {
      var expected = require('./fixtures/usa-stops.json');
      should.exist(trip);
      should.not.exist(err);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported gpx track', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/usa-track.gpx');
    parse(stream, function(err, trip) {
      var expected = require('./fixtures/usa-track.json');
      should.exist(trip);
      should.not.exist(err);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported garmin route point extension', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/rpt-ext.gpx');
    parse(stream, function(err, trip) {
      var expected = require('./fixtures/rpt-ext.json');
      should.not.exist(err);
      should.exist(trip);
      trip.should.eql(expected);
      done();
    });
  });

  it('should raise error on invalid XML file', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/invalid.gpx');
    parse(stream, function(err, trip) {
      should.exist(err);
      should.not.exist(trip);
      done();
    });
  });
});
