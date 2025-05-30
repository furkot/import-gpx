import garminData from '@furkot/garmin-data';
import guruData from '@furkot/guru-data';
import sss from 'sax-super-stream';

const { colors: toGarminColors, toGarmin, toFurkot: fromGarmin } = garminData;
const { toFurkotColors: fromGuruColors, toGuru, toFurkot: fromGuru } = guruData;

const schemas = {
  garmin: 'http://www.garmin.com/xmlschemas/GpxExtensions/v3'
};

const pins = [
  ['garmin', fromGarmin, toGarmin],
  ['guru', fromGuru, toGuru]
].reduce((result, [key, from, to]) => {
  result[key] = Object.keys(from).reduce(
    (result, key) => {
      result[('' + key).toLowerCase()] = from[key];
      return result;
    },
    Object.keys(to).reduce((result, key) => {
      result[('' + to[key]).toLowerCase()] = key;
      return result;
    }, {})
  );
  return result;
}, {});
const colors = [['garmin', toGarminColors]].reduce((result, [key, colors]) => {
  result[key] = Object.keys(colors).reduce((result, color) => {
    result[colors[color].toLowerCase()] = Number.parseInt(color, 10);
    return result;
  }, {});
  return result;
}, {});
colors.guru = Object.keys(fromGuruColors).reduce((result, color) => {
  result[color.toLowerCase()] = fromGuruColors[color];
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
  address = [address.street, address.city, address.state, address.country].filter(notEmpty).join(', ');
  obj.address = address;
}

function stringParser(property) {
  return (text, obj) => (obj[property] = text);
}

function parsePin(pin, stop) {
  if (Object.hasOwn(toGarmin, pin)) {
    stop.pin = pin;
  }
  pin = pin.toLowerCase();
  if (Object.hasOwn(pins.garmin, pin)) {
    stop.pin = pins.garmin[pin];
  }
  stop.pin = Number.parseInt(stop.pin, 10);
  if (Number.isNaN(stop.pin)) {
    delete stop.pin;
  }
}

function parseWaypointType(type, stop) {
  if (Object.hasOwn(pins.guru, type)) {
    stop.pin = pins.guru[type];
  }
}

function parseColor(color, track) {
  color = color.toLowerCase();
  if (Object.hasOwn(colors.garmin, color)) {
    track.color = colors.garmin[color];
  }
}

function parseTrackType(type, track) {
  type = type.toLowerCase();
  if (Object.hasOwn(colors.guru, type)) {
    track.color = colors.guru[type];
  }
}

function parseCoordinates({ attributes: { lat, lon } }, parent) {
  parent.stops = parent.stops || [];
  const stop = {
    coordinates: {
      lat: Number.parseFloat(lat.value),
      lon: Number.parseFloat(lon.value)
    }
  };
  parent.stops.push(stop);
  return stop;
}

function parseLink({ attributes: { href } }, parent) {
  parent.url = href.value;
}

function appendToPolyline({ attributes: { lat, lon } }, parent) {
  const point = [Number.parseFloat(lon.value), Number.parseFloat(lat.value)];
  if (!parent.polyline) {
    parent.polyline = [point];
  } else {
    parent.polyline.push(point);
  }
}

const WAYPOINTEXTENSION = {
  WaypointExtension: {
    $uri: schemas.garmin,
    $after: convertAddress,
    Address: {
      $: sss.addChild('address'),
      StreetAddress: { $text: stringParser('street') },
      City: { $text: stringParser('city') },
      State: { $text: stringParser('state') },
      Country: { $text: stringParser('country') }
    },
    PhoneNumber: { $text: stringParser('phone') }
  }
};

const ROUTEPOINTEXTENSION = {
  RoutePointExtension: {
    $uri: schemas.garmin,
    $: sss.addChild('route'),
    rpt: appendToPolyline
  }
};

const BASIC_PARSERS = {
  name: { $text: stringParser('name') },
  desc: { $text: stringParser('notes') },
  link: parseLink
};

const PT_PARSERS = Object.assign(
  {
    $: parseCoordinates,
    sym: { $text: parsePin },
    time: { $text: stringParser('timestamp') }
  },
  BASIC_PARSERS
);

const WPT_PARSERS = Object.assign(
  {
    type: { $text: parseWaypointType },
    extensions: WAYPOINTEXTENSION
  },
  PT_PARSERS
);

const RTEPT_PARSERS = Object.assign(
  {
    extensions: ROUTEPOINTEXTENSION
  },
  PT_PARSERS
);

const GPX_PARSERS = {
  gpx: {
    $: sss.object(),
    metadata: {
      name: { $text: stringParser('destination') },
      desc: { $text: stringParser('notes') },
      link: parseLink
    },
    wpt: WPT_PARSERS,
    trk: {
      $: sss.appendToCollection('track'),
      name: { $text: stringParser('name') },
      desc: { $text: stringParser('notes') },
      link: parseLink,
      type: { $text: parseTrackType },
      extensions: {
        TrackExtension: {
          $uri: schemas.garmin,
          DisplayColor: { $text: parseColor }
        }
      },
      trkseg: {
        trkpt: {
          $: parseCoordinates,
          time: { $text: stringParser('timestamp') }
        }
      }
    },
    rte: {
      $: sss.appendToCollection('route'),
      name: { $text: stringParser('name') },
      desc: { $text: stringParser('notes') },
      rtept: RTEPT_PARSERS
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
    .filter(rt => rt.stops?.length)
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

export default async function parseGpx(file) {
  const stream = sss(GPX_PARSERS);
  let trip;

  await file.pipeThrough(stream).pipeTo(
    new WritableStream({
      write: chunk => (trip = chunk)
    })
  );

  postParseCollection(trip, 'track', convertTrack);
  if (!(trip.stops && trip.track) || file.query?.route === '1') {
    postParseCollection(trip, 'route', convertRoute);
  } else {
    delete trip.route;
  }

  return trip;
}
