var garmin = require('furkot-garmin-data');
var sss = require('sax-super-stream');
var polyline = require('polyline-encoded');
var schemas = {
  'garmin': 'http://www.garmin.com/xmlschemas/GpxExtensions/v3'
};

module.exports = parseGpx;

var furkot2garmin = garmin.toGarmin;
var garmin2furkot = Object.keys(garmin.toFurkot).reduce(function (result, key) {
  result[key.toLowerCase()] = garmin.toFurkot[key];
  return result;
}, Object.keys(garmin.toGarmin).reduce(function (result, key) {
  result[garmin.toGarmin[key].toLowerCase()] = key;
  return result;
}, {}));


function notEmpty(str) {
  return str;
}

function convertAddress(obj) {
  var address = obj.address;
  if (!address) {
    return;
  }
  if (address.country === 'USA' || address.country === 'US' || address.country === 'United States') {
    // skip country if US
    address.country = undefined;
  }
  address = [
    address.street,
    address.city,
    address.state,
    address.country
  ].filter(notEmpty).join(', ');
  obj.address = address;
}

function stringParser(property) {
  return function assignProperty(text, obj) { obj[property] = text; };
}

function parsePin(pin, stop) {
  if (furkot2garmin.hasOwnProperty(pin)) {
    stop.pin = pin;
  }
  pin = pin.toLowerCase();
  if (garmin2furkot.hasOwnProperty(pin)) {
    stop.pin = garmin2furkot[pin];
  }
  stop.pin = parseInt(stop.pin, 10);
  if (Number.isNaN(stop.pin)) {
    delete stop.pin;
  }
}

function parseCoordinates(node, parent) {
  parent.stops = parent.stops || [];
  var stop = {
    coordinates: {
      lat: parseFloat(node.attributes.lat.value),
      lon: parseFloat(node.attributes.lon.value)
    }
  };
  parent.stops.push(stop);
  return stop;
}

function parseLink(node, parent) {
  parent.url = node.attributes.href.value;
}


function appendToPolyline(node, parent) {
  var point = [
    // note: LAT, LON is what polyline-encoded expects - different from Furkot's x,y - lon,lat standard
    parseFloat(node.attributes.lat.value),
    parseFloat(node.attributes.lon.value)
  ];
  if (!parent.polyline) {
    parent.polyline = [ point ];
  } else {
    parent.polyline.push(point);
  }
}

function encodePolyline(node) {
  if (!node.polyline) {
    return;
  }
  node.polyline = polyline.encode(node.polyline);
}

var WAYPOINTEXTENSION = {
  'WaypointExtension': {
    $uri: schemas.garmin,
    $after: convertAddress,
    'Address': {
      $: sss.addChild('address'),
      'StreetAddress': { $text: stringParser('street') },
      'City': { $text: stringParser('city') },
      'State': { $text: stringParser('state') },
      'Country': { $text: stringParser('country') }
    },
    'PhoneNumber': { $text: stringParser('phone') }
  }
};

var ROUTEPOINTEXTENSION = {
  'RoutePointExtension': {
    $uri: schemas.garmin,
    $: sss.addChild('route'),
    $after: encodePolyline,
    'rpt': appendToPolyline
  }
};

var BASIC_PARSERS = {
  'name': { $text: stringParser('name') },
  'desc': { $text: stringParser('notes') },
  'link': parseLink
};

var PT_PARSERS = Object.assign({
  $: parseCoordinates,
  'sym':  { $text: parsePin },
  'time': { $text: stringParser('timestamp') },
}, BASIC_PARSERS);

var WPT_PARSERS = Object.assign({
  'extensions': WAYPOINTEXTENSION
}, PT_PARSERS);

var RTEPT_PARSERS = Object.assign({
  'extensions': ROUTEPOINTEXTENSION
}, PT_PARSERS);

var GPX_PARSERS = {
  'gpx': {
    $: sss.object(),
    'metadata': {
      'name': { $text: stringParser('destination') },
      'desc': { $text: stringParser('notes') }
    },
    'wpt': WPT_PARSERS,
    'trk': {
      $: sss.appendToCollection('track'),
      'name': { $text: stringParser('name') },
      'desc': { $text: stringParser('notes') },
      'link': parseLink,
      'trkseg': {
        'trkpt': {
          $: parseCoordinates,
          'time': { $text: stringParser('timestamp') }
        }
      }
    },
    'rte': {
      $: sss.appendToCollection('route'),
      'name': { $text: stringParser('name') },
      'desc': { $text: stringParser('notes') },
      'rtept': RTEPT_PARSERS
    }
  }
};


function moveRouteToNext(context, rt) {
  var route = rt.route;
  if (context.previous) {
    rt.route = context.previous;
  } else if (rt.route) {
    delete rt.route;
  }
  context.previous = route;
}

function convertRoute(trip, rt, parent) {
  var context = {};
  if (rt.name) {
    parent.name = rt.name;
    if (!trip.destination) {
      trip.destination = rt.name;
    }
  }
  if (rt.notes) {
    parent.notes = rt.notes;
    if (!trip.notes) {
      trip.notes = rt.notes;
    }
  }
  if (rt.stops[0].route) {
    parent.subtrack = true;
  }
  rt.stops.forEach(moveRouteToNext.bind(null, context));
}


function postParseCollection(trip, collectionName, convertFn) {
  var collection = trip[collectionName];

  if (!collection) {
    return;
  }
  collection = collection
  .filter(function(rt) {
    return rt.stops && rt.stops.length;
  })
  .map(function(rt, index) {
    var parent = { index: index };
    rt.stops[0].parent = parent;
    if (convertFn) {
      convertFn(trip, rt, parent);
    }
    return rt.stops;
  });
  if (collection.length) {
    trip[collectionName] = collection;
  } else {
    delete trip[collectionName];
  }
}

function parseGpx(file, fn) {
  var stream = sss(GPX_PARSERS);

  stream
  .on('data', function(trip) {
    postParseCollection(trip, 'track');
    if (!(trip.stops && trip.track) || (file.query && file.query.route === '1')) {
      postParseCollection(trip, 'route', convertRoute);
    } else {
      delete trip.route;
    }

    fn(null, trip);
  })
  .on('error', function(err) {
    fn({
      err: 'invalid',
      message: err.message
    });
  });
  file.pipe(stream);
}
