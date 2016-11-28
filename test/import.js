var should = require('should');
var fs = require('fs');
var parse = require('..');

describe('GPX import', function() {
  it('parser imported gpx route', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/usa.gpx');
    parse(stream, function(err, trip) {
      var expected = require('./fixtures/usa.json');
      expected = {
        destination: expected.destination,
        notes: expected.notes,
        route: [ expected.stops ]
      };
      // require('fs').writeFileSync('usa2.json', JSON.stringify(trip, null, 2));
      should.exist(trip);
      should.not.exist(err);
      trip.route[0][0].parent.should.eql({
        index: 0,
        name: expected.destination,
        notes: expected.notes
      });
      delete trip.route[0][0].parent;
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported gpx stops', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/usa-stops.gpx');
    parse(stream, function(err, trip) {
      var expected = require('./fixtures/usa.json');
      // require('fs').writeFileSync('usa2.json', JSON.stringify(trip, null, 2));
      should.exist(trip);
      should.not.exist(err);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported gpx single stop', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/single-stop.gpx');
    parse(stream, function(err, trip) {
      var expected = require('./fixtures/usa.json');
      expected = {
        destination: expected.destination,
        notes: expected.notes,
        stops: [{
          address: '1050 Fall River Court, Estes Park, CO',
          coordinates: expected.stops[0].coordinates,
          pin: 78,
          phone: '(508) 872-6101'
        }]
      };
      should.not.exist(err);
      should.exist(trip);
      trip.should.eql(expected);
      done();
    });
  });

  it('parser imported gpx track', function(done) {
    var stream = fs.createReadStream(__dirname + '/fixtures/usa-track.gpx');
    parse(stream, function(err, trip) {
      var expected = require('./fixtures/usa.json'), stops;
      stops = expected.stops.map(function (st) {
        return {
          coordinates: st.coordinates
        };
      });
      stops[0].parent = {
        index: 1
      };
      expected = {
        destination: expected.destination,
        notes: expected.notes,
        track: [
          [ Object.assign({}, stops[0], { parent: { index: 0 } }) ],
          stops
        ]
      };
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
});
