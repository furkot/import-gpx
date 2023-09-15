const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');

const parse = require('..');


/* global TextDecoderStream */

function createFromStream(file) {
  const name = path.join(__dirname, file);
  const stream = fs.createReadStream(name);
  return Readable.toWeb(stream).pipeThrough(new TextDecoderStream());
}

test('parser imported gpx single stop', async function () {
  const stream = createFromStream('/fixtures/single-stop.gpx');
  const trip = await parse(stream);
  const expected = require('./fixtures/single-stop.json');
  assert.deepEqual(trip, expected);
});

test('parser imported gpx route', async function () {
  const stream = createFromStream('/fixtures/usa-route.gpx');
  const trip = await parse(stream);
  const expected = require('./fixtures/usa-route.json');
  // require('fs').writeFileSync('usa-route.json', JSON.stringify(trip, null, 2));
  assert.deepEqual(trip, expected);
});

test('parser imported gpx stops', async function () {
  const stream = createFromStream('/fixtures/usa-stops.gpx');
  const trip = await parse(stream);
  const expected = require('./fixtures/usa-stops.json');
  assert.deepEqual(trip, expected);
});

test('parser imported gpx track', async function () {
  const stream = createFromStream('/fixtures/usa-track.gpx');
  const trip = await parse(stream);
  const expected = require('./fixtures/usa-track.json');
  assert.deepEqual(trip, expected);
});

test('parser imported garmin route point extension', async function () {
  const stream = createFromStream('/fixtures/rpt-ext.gpx');
  const trip = await parse(stream);
  const expected = require('./fixtures/rpt-ext.json');
  assert.deepEqual(trip, expected);
});

test('parser imported garmin color track', async function () {
  const stream = createFromStream('/fixtures/color-garmin.gpx');
  const trip = await parse(stream);
  const expected = require('./fixtures/color-garmin.json');
  assert.deepEqual(trip, expected);
});

test('parser imported guru color track', async function () {
  const stream = createFromStream('/fixtures/color-guru.gpx');
  const trip = await parse(stream);
  const expected = require('./fixtures/color-guru.json');
  assert.deepEqual(trip, expected);
});

test('parser imported gpx link', async function () {
  const stream = createFromStream('/fixtures/with-link.gpx');
  const trip = await parse(stream);
  const expected = require('./fixtures/with-link.json');
  assert.deepEqual(trip, expected);
});

test('empty GPX', async function () {
  const stream = createFromStream('/fixtures/empty.gpx');
  const trip = await parse(stream);
  assert.deepEqual(trip, { destination: 'empty' });
});

test('should raise error on invalid XML file', async function () {
  const stream = createFromStream('/fixtures/invalid.gpx');
  await assert.rejects(parse(stream));
});
