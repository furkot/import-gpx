[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][gemnasium-image]][gemnasium-url]

# furkot-import-gpx

Import GPX for Furkot

## Install

```sh
$ npm install --save furkot-import-gpx
```

## Usage

Use as a transform stream: pipe network responses, files etc. and listen on `data` event.

```js
var furkotImportGpx = require('furkot-import-gpx');
var request = require('getlet');

request('https://example.com/my.gpx')
  .pipe(furkotImportGpx)
  .on('data', function(trip) {
    console.log(trip);
  });

```

## License

MIT © [Damian Krzeminski](https://code42day.com)

[npm-image]: https://img.shields.io/npm/v/furkot-import-gpx.svg
[npm-url]: https://npmjs.org/package/furkot-import-gpx

[travis-url]: https://travis-ci.org/furkot/import-gpx
[travis-image]: https://img.shields.io/travis/furkot/import-gpx.svg

[gemnasium-image]: https://img.shields.io/gemnasium/furkot/import-gpx.svg
[gemnasium-url]: https://gemnasium.com/furkot/import-gpx
