[![NPM version][npm-image]][npm-url]
[![Build Status][build-image]][build-url]
[![Dependency Status][deps-image]][deps-url]

# @furkot/import-gpx

Import GPX for Furkot

## Install

```sh
$ npm install --save @furkot/import-gpx
```

## Usage

Use as a transform stream: pipe network responses, files etc. and listen on `data` event.

```js
var furkotImportGpx = require('@furkot/import-gpx');
var request = require('getlet');

request('https://example.com/my.gpx')
  .pipe(furkotImportGpx)
  .on('data', function(trip) {
    console.log(trip);
  });

```

## License

MIT © [Damian Krzeminski](https://code42day.com)

[npm-image]: https://img.shields.io/npm/v/@furkot/import-gpx
[npm-url]: https://npmjs.org/package/@furkot/import-gpx

[build-url]: https://github.com/furkot/import-gpx/actions/workflows/check.yaml
[build-image]: https://img.shields.io/github/actions/workflow/status/furkot/import-gpx/check.yaml?branch=main

[deps-image]: https://img.shields.io/librariesio/release/npm/@furkot/import-gpx
[deps-url]: https://libraries.io/npm/@furkot%2Fimport-gpx
