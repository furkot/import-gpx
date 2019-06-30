const { colors: toGarminColors, toGarmin, toFurkot: fromGarmin } = require('furkot-garmin-data');
const { colors: toGuruColors, toGalileo: toGuru, toFurkot: fromGuru } = require('furkot-galileo-data');
const sss = require('sax-super-stream');
const schemas = {
  'garmin': 'http://www.garmin.com/xmlschemas/GpxExtensions/v3'
};

module.exports = parseGpx;

const pins = [
  ['garmin', fromGarmin, toGarmin],
  ['guru', fromGuru, toGuru]
].reduce((result, [key, from, to]) => {
  result[key] = Object.keys(from).reduce((result, key) => {
    result[('' + key).toLowerCase()] = from[key];
    return result;
  }, Object.keys(to).reduce((result, key) => {
    result[('' + to[key]).toLowerCase()] = key;
    return result;
  }, {}));
  return result;
}, {});
const colors = [
  ['garmin', toGarminColors],
  ['guru', toGuruColors]
].reduce((result, [ key, colors ]) => {
  result[key] = Object.keys(colors).reduce((result, color) => {
    result[colors[color].toLowerCase()] = parseInt(color, 10);
    return result;
  }, {});
  return result;
}, {});

function notEmpty(str) {
  return str;
}

function convertAddress(obj) {
  let { address } = obj;
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
  return (text, obj) => obj[property] = text;
}

function parsePin(pin, stop) {
  if (toGarmin.hasOwnProperty(pin)) {
    stop.pin = pin;
  }
  pin = pin.toLowerCase();
  if (pins.garmin.hasOwnProperty(pin)) {
    stop.pin = pins.garmin[pin];
  }
  stop.pin = parseInt(stop.pin, 10);
  if (Number.isNaN(stop.pin)) {
    delete stop.pin;
  }
}

function parseWaypointType(type, stop) {
  if (pins.guru.hasOwnProperty(type)) {
    stop.pin = pins.guru[type];
  }
}

function parseColor(color, track) {
  color = color.toLowerCase();
  if (colors.garmin.hasOwnProperty(color)) {
    track.color = colors.garmin[color];
  }
}

function parseTrackType(type, track) {
  type = type.toLowerCase();
  if (colors.guru.hasOwnProperty(type)) {
    track.color = colors.guru[type];
  }
}

function parseCoordinates({ attributes: { lat, lon } }, parent) {
  parent.stops = parent.stops || [];
  const stop = {
    coordinates: {
      lat: parseFloat(lat.value),
      lon: parseFloat(lon.value)
    }
  };
  parent.stops.push(stop);
  return stop;
}

function parseLink({ attributes: { href } }, parent) {
  parent.url = href.value;
}


function appendToPolyline({ attributes: { lat, lon } }, parent) {
  const point = [
    parseFloat(lon.value),
    parseFloat(lat.value)
  ];
  if (!parent.polyline) {
    parent.polyline = [ point ];
  } else {
    parent.polyline.push(point);
  }
}

const WAYPOINTEXTENSION = {
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

const ROUTEPOINTEXTENSION = {
  'RoutePointExtension': {
    $uri: schemas.garmin,
    $: sss.addChild('route'),
    'rpt': appendToPolyline
  }
};

const BASIC_PARSERS = {
  'name': { $text: stringParser('name') },
  'desc': { $text: stringParser('notes') },
  'link': parseLink
};

const PT_PARSERS = Object.assign({
  $: parseCoordinates,
  'sym':  { $text: parsePin },
  'time': { $text: stringParser('timestamp') },
}, BASIC_PARSERS);

const WPT_PARSERS = Object.assign({
  'type': { $text: parseWaypointType },
  'extensions': WAYPOINTEXTENSION
}, PT_PARSERS);

const RTEPT_PARSERS = Object.assign({
  'extensions': ROUTEPOINTEXTENSION
}, PT_PARSERS);

const GPX_PARSERS = {
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
      'type': { $text: parseTrackType },
      'extensions': {
        'TrackExtension': {
          $uri: schemas.garmin,
          'DisplayColor': { $text: parseColor }
        }
      },
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
  const route = rt.route;
  if (context.previous) {
    rt.route = context.previous;
  } else if (rt.route) {
    delete rt.route;
  }
  context.previous = route;
}

function convertTrack(trip, rt, parent) {
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
  if (rt.color) {
    parent.color = rt.color;
  }
}

function convertRoute(trip, rt, parent) {
  const context = {};
  convertTrack(trip, rt, parent);
  if (rt.stops[0].route) {
    parent.subtrack = true;
  }
  rt.stops.forEach(moveRouteToNext.bind(null, context));
}


function postParseCollection(trip, collectionName, convertFn) {
  let collection = trip[collectionName];

  if (!collection) {
    return;
  }
  collection = collection
  .filter(rt => rt.stops && rt.stops.length)
  .map((rt, index) => {
    const parent = { index };
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
  const stream = sss(GPX_PARSERS);

  stream
  .on('data', trip => {
    postParseCollection(trip, 'track', convertTrack);
    if (!(trip.stops && trip.track) || (file.query && file.query.route === '1')) {
      postParseCollection(trip, 'route', convertRoute);
    } else {
      delete trip.route;
    }

    fn(null, trip);
  })
  .on('error', err => {
    fn({
      err: 'invalid',
      message: err.message
    });
  });
  file.pipe(stream);
}
