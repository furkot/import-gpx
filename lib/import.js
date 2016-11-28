var saxStream = require('sax-stream');
var util = require('./util');
var garmin = require('./garmin');
var polylineEncoded = require('polyline-encoded');
var schemas = {
  'http://www.garmin.com/xmlschemas/GpxExtensions/v3': 'gpxx'
};


module.exports = parseGpx;

var furkot2garmin = garmin.toGarmin;
var conformStop = util.conformStop;

var garmin2furkot = Object.keys(garmin.toFurkot).reduce(function (result, key) {
  result[key.toLowerCase()] = garmin.toFurkot[key];
  return result;
}, Object.keys(garmin.toGarmin).reduce(function (result, key) {
  result[garmin.toGarmin[key].toLowerCase()] = key;
  return result;
}, {}));

function parseTrackPoint(trkpt) {
  var stop = {
    coordinates: {}
  };
  util.copyAttr(stop.coordinates, 'lon', trkpt, 'LON');
  util.copyAttr(stop.coordinates, 'lat', trkpt, 'LAT');
  if (trkpt.children) {
    util.copyProp(stop, 'timestamp', trkpt, 'TIME');
  }
  return conformStop(stop);
}

function reduceTrackSegment(result, trkseg) {
  if (trkseg && trkseg.children && trkseg.children.TRKPT) {
    trkseg = util.toArray(trkseg.children.TRKPT).map(parseTrackPoint);
    trkseg[0].parent = result.parent;
    result.track.push(trkseg);
  }
  return result;
}

function reduceTrack(track, trk, i) {
  var parent = {
    index: i
  };
  util.copyProp(parent, 'name', trk, 'NAME');
  util.copyProp(parent, 'notes', trk, 'DESC');
  if (trk.children) {
    if (trk.children.LINK) {
      util.copyAttr(parent, 'url', trk.children.LINK, 'HREF');
    }
    if (trk.children.TRKSEG) {
      track = util.toArray(trk.children.TRKSEG).reduce(reduceTrackSegment, {
        track: track,
        parent: parent
      }).track;
    }
  }
  return track;
}

function parseTrack(trip, trk) {
  var track;
  if (!trk) {
    return;
  }
  track = util.toArray(trk).reduce(reduceTrack, []);
  if (track.length > 0) {
    trip.track = track;
  }
}

function notEmpty(str) {
  return str;
}

function parseAddress(namespace, stop, extension) {
  var address, obj;
  if (extension) {
    util.copyProp(stop, 'phone', extension, namespace + ':PHONENUMBER');
    if (extension.children[namespace + ':ADDRESS']) {
      obj = [];
      address = extension.children[namespace + ':ADDRESS'];
      util.copyProp(obj, 0, address, namespace + ':STREETADDRESS');
      util.copyProp(obj, 1, address, namespace + ':CITY');
      util.copyProp(obj, 2, address, namespace + ':STATE');
      util.copyProp(obj, 3, address, namespace + ':COUNTRY');
      if (obj[3] === 'USA' || obj[3] === 'US' || obj[3] === 'United States') {
        obj.length = 3;
      }
      obj = obj.filter(notEmpty).join(', ');
      if (obj) {
        stop.address = obj;
      }
    }
  }
}

function parseRouteTrack(namespace, extension) {
  var trk;
  if (extension) {
    if (extension.children[namespace + ':RPT']) {
      trk = util.toArray(extension.children[namespace + ':RPT']).map(function (rpt) {
        var ll = [];
        util.copyAttr(ll, 0, rpt, 'LAT');
        util.copyAttr(ll, 1, rpt, 'LON');
        return ll;
      });
      if (trk.length) {
        return polylineEncoded.encode(trk);
      }
    }
  }
}

function parseRoutePointExtensions(key) {
  var node = this.children[key], namespaces = parseSchemas(node), stop = this.stop;
  if (namespaces.gpxx) {
    if (key === namespaces.gpxx + ':WAYPOINTEXTENSION') {
      parseAddress(namespaces.gpxx, stop, node);
      this.cnt -= 1;
    }
    else if (key === namespaces.gpxx + ':ROUTEPOINTEXTENSION') {
      this.polyline = parseRouteTrack(namespaces.gpxx, node);
      this.cnt -= 1;
    }
  }
  return !this.cnt;
}

function initStop(route) {
  var stop = {
    coordinates: {}
  };
  if (route) {
    stop.route = route;
  }
  return stop;
}

function parseRoutePoint(rtept) {
  var stop = initStop(this.route), namespaces = this.namespaces, parent = this.parent, params;
  if (!rtept) {
    return;
  }
  util.copyAttr(stop.coordinates, 'lon', rtept, 'LON');
  util.copyAttr(stop.coordinates, 'lat', rtept, 'LAT');
  if (rtept.children) {
    util.copyProp(stop, 'name', rtept, 'NAME');
    util.copyProp(stop, 'notes', rtept, 'DESC');
    util.copyProp(stop, 'timestamp', rtept, 'TIME');
    if (rtept.children.LINK) {
      util.copyAttr(stop, 'url', rtept.children.LINK, 'HREF');
    }
    if (rtept.children.EXTENSIONS) {
      params = {};
      if (namespaces.gpxx) {
        parseAddress(namespaces.gpxx, stop, rtept.children.EXTENSIONS.children[namespaces.gpxx + ':WAYPOINTEXTENSION']);
        params.polyline = parseRouteTrack(namespaces.gpxx,
            rtept.children.EXTENSIONS.children[namespaces.gpxx + ':ROUTEPOINTEXTENSION']);
      }
      else if (rtept.children.EXTENSIONS.children) {
        params.stop = stop;
        params.children = rtept.children.EXTENSIONS.children;
        params.cnt = 2;
        Object.keys(rtept.children.EXTENSIONS.children).some(parseRoutePointExtensions, params);
      }
      if (params.polyline) {
        this.route = {
          polyline: params.polyline
        };
        parent.subtrack = true;
      }
    }
    util.copyProp(stop, 'pin', rtept, 'SYM');
    if (stop.pin && !furkot2garmin.hasOwnProperty(stop.pin)) {
      stop.pin = stop.pin.toLowerCase();
      if (garmin2furkot.hasOwnProperty(stop.pin)) {
        stop.pin = garmin2furkot[stop.pin];
      }
      else {
        delete stop.pin;
      }
    }
  }
  return conformStop(stop);
}

function parseRoute(trip, namespaces, rte) {
  var route;
  if (!rte) {
    return;
  }
  route = util.toArray(rte).reduce(function (route, rte, i) {
    var parent = {
      index: i
    };
    util.copyProp(parent, 'name', rte, 'NAME');
    util.copyProp(parent, 'notes', rte, 'DESC');
    if (!trip.destination) {
      trip.destination = parent.name;
    }
    if (!trip.notes && parent.notes) {
      trip.notes = parent.notes;
    }
    if (rte.children) {
      if (rte.children.LINK) {
        util.copyAttr(parent, 'url', rte.children.LINK, 'HREF');
        if (!trip.url) {
          trip.url = parent.url;
        }
      }
      if (rte.children.RTEPT) {
        rte = util.toArray(rte.children.RTEPT).map(parseRoutePoint, {
          namespaces: namespaces,
          parent: parent
        });
        rte[0].parent = parent;
        route.push(rte);
      }
    }
    return route;
  }, []);
  if (route.length > 0) {
    trip.route = route;
  }
}

function parseWaypoints(trip, namespaces, wpts) {
  if (!wpts) {
    return;
  }
  trip.stops = util.toArray(wpts).map(parseRoutePoint, {
    namespaces: namespaces,
    parent: {}
  });
}

function parseMetadata(trip, metadata) {
  if (metadata) {
    util.copyProp(trip, 'destination', metadata, 'NAME');
    util.copyProp(trip, 'notes', metadata, 'DESC');
  }
}

function parseSchemas(gpx) {
  if (!gpx.attribs) {
    return {};
  }
  return Object.keys(gpx.attribs).reduce(function (result, attr) {
    var schema, nspace = attr.split(':');
    if (nspace.length === 2 && nspace[0] === 'XMLNS') {
      schema = schemas[gpx.attribs[attr]];
      if (schema) {
        result[schema] = nspace[1];
      }
    }
    return result;
  }, {});
}

function parseGpx(file, fn) {
  var trip, namespaces;

  file
    .pipe(saxStream({
      tag: 'GPX'
    }))
    .on('data', function(gpx) {
      try {
        if (!gpx || !gpx.children) {
          return fn('invalid');
        }
        trip = {};
        namespaces = parseSchemas(gpx);
        parseMetadata(trip, gpx.children.METADATA);
        parseWaypoints(trip, namespaces, gpx.children.WPT);
        parseTrack(trip, gpx.children.TRK);
        if (!(trip.stops && trip.track) || (file.query && file.query.route === '1')) {
          parseRoute(trip, namespaces, gpx.children.RTE);
        }
        process.nextTick(function() {
          fn(null, trip);
        });
      } catch (e) {
        fn('invalid');
      }
    })
    .on('end', function () {
      if (!trip) {
        return fn('invalid');
      }
    })
    .on('error', fn);
}
