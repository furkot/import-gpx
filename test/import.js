import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import test from 'node:test';

import parse from '../lib/import.js';

function createFromStream(file) {
  const name = path.resolve(import.meta.dirname, file);
  const stream = fs.createReadStream(name);
  return Readable.toWeb(stream).pipeThrough(new TextDecoderStream());
}

function readJSON(file) {
  const name = path.resolve(import.meta.dirname, file);
  return JSON.parse(fs.readFileSync(name, 'utf8'));
}

test('parser imported gpx single stop', async () => {
  const stream = createFromStream('./fixtures/single-stop.gpx');
  const trip = await parse(stream);
  const expected = readJSON('./fixtures/single-stop.json');
  assert.deepEqual(trip, expected);
});

test('parser imported gpx route', async () => {
  const stream = createFromStream('./fixtures/usa-route.gpx');
  const trip = await parse(stream);
  const expected = readJSON('./fixtures/usa-route.json');
  // require('fs').writeFileSync('usa-route.json', JSON.stringify(trip, null, 2));
  assert.deepEqual(trip, expected);
});

test('parser imported gpx stops', async () => {
  const stream = createFromStream('./fixtures/usa-stops.gpx');
  const trip = await parse(stream);
  const expected = readJSON('./fixtures/usa-stops.json');
  assert.deepEqual(trip, expected);
});

test('parser imported gpx track', async () => {
  const stream = createFromStream('./fixtures/usa-track.gpx');
  const trip = await parse(stream);
  const expected = readJSON('./fixtures/usa-track.json');
  assert.deepEqual(trip, expected);
});

test('parser imported garmin route point extension', async () => {
  const stream = createFromStream('./fixtures/rpt-ext.gpx');
  const trip = await parse(stream);
  const expected = readJSON('./fixtures/rpt-ext.json');
  assert.deepEqual(trip, expected);
});

test('parser imported garmin color track', async () => {
  const stream = createFromStream('./fixtures/color-garmin.gpx');
  const trip = await parse(stream);
  const expected = readJSON('./fixtures/color-garmin.json');
  assert.deepEqual(trip, expected);
});

test('parser imported guru color track', async () => {
  const stream = createFromStream('./fixtures/color-guru.gpx');
  const trip = await parse(stream);
  const expected = readJSON('./fixtures/color-guru.json');
  assert.deepEqual(trip, expected);
});

test('parser imported gpx link', async () => {
  const stream = createFromStream('./fixtures/with-link.gpx');
  const trip = await parse(stream);
  const expected = readJSON('./fixtures/with-link.json');
  assert.deepEqual(trip, expected);
});

test('empty GPX', async () => {
  const stream = createFromStream('./fixtures/empty.gpx');
  const trip = await parse(stream);
  assert.deepEqual(trip, { destination: 'empty' });
});

test('should raise error on invalid XML file', async () => {
  const stream = createFromStream('./fixtures/invalid.gpx');
  await assert.rejects(parse(stream));
});
