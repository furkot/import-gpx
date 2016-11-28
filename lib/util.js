module.exports = {
  toArray: toArray,
  copyProp: copyProp,
  copyAttr: copyAttr,
  conformStop: conformStop
};

function toArray(arr) {
  return Array.isArray(arr) ? arr : [arr];
}

function copyProp(dest, propDest, src, propSrc) {
  if (src.children && src.children[propSrc] && src.children[propSrc].value) {
    dest[propDest] = src.children[propSrc].value;
  }
}

function copyAttr(dest, propDest, src, propSrc) {
  dest[propDest] = src.attribs && src.attribs[propSrc];
}

function conformInt(prop) {
  var obj = this;
  if (typeof obj[prop] === 'string') {
    obj[prop] = parseInt(obj[prop], 10);
    if (isNaN(obj[prop])) {
      delete obj[prop];
    }
  }
}

function conformIntOrString(prop) {
  var obj = this, val;
  if (typeof obj[prop] === 'string' && !/[a-zA-Z]/.test(obj[prop])) {
    // a string that has a good chance of being a number
    val = parseInt(obj[prop], 10);
    if (!isNaN(val)) {
      obj[prop] = val;
    }
  }
}

function conformStop(stop) {
  var params = this;
  if (!stop.coordinates) {
    if (stop.lat && stop.lon) {
      stop.coordinates = {
        lat: stop.lat,
        lon: stop.lon
      };
    }
  }
  // stop = conform(STOP_MODEL, stop);
  if (stop.coordinates) {
    if (typeof stop.coordinates.lat === 'string') {
      stop.coordinates.lat = parseFloat(stop.coordinates.lat);
    }
    if (typeof stop.coordinates.lon === 'string') {
      stop.coordinates.lon = parseFloat(stop.coordinates.lon);
    }
  }
  [ 'pin', 'duration' ].forEach(conformIntOrString, stop);
  if (stop.route) {
    [ 'duration', 'distance' ].forEach(conformInt, stop.route);
  }
  if (params && params.uid) {
    stop.uid = params.uid;
  }
  return stop;
}
