
3.0.0 / 2023-09-15
==================

 * using browser enabled super sax stream
 * change to to @furkot/import-gpx

2.0.5 / 2023-04-22
==================

 * update to @furkot/guru-data 2.1.0
 * update to @furkot/garmin-data 2.1.0

2.0.4 / 2022-04-25
==================

 * extract link from metadata if present
 * modernize test code

2.0.3 / 2022-01-05
==================

 * upgrade `mocha` and `should`

2.0.2 / 2019-07-19
==================

 * test with file exported from Guru (formerly Galileo)
 * use actual Guru colors
 * furkot-galileo-data 1.0.0 -> 1.0.1
 * test for GPX without any points

2.0.1 / 2019-06-29
==================

 * decode pins as Guru (formerly Galileo) value of the waypoint <type> node
 * decode track colors as Guru (formerly Galileo) value of the track <type> node
 * decode track colors as Garmin extension
 * update to ES6
 * upgrade mocha

2.0.0 / 2018-07-25
==================

 * remove @pirxpilot/google-polyline module
 * return all polylines as array of lon,lat pairs without encoding

1.0.5 / 2017-07-25
==================

 * replace code42day-google-polyline with @pirxpilot/google-polyline

1.0.4 / 2017-01-02
==================

 * parse track name and description

1.0.3 / 2016-12-18
==================

 * replace polyline-encoded with google-polyline

1.0.2 / 2016-12-14
==================

 * fix error format

1.0.1 / 2016-12-13
==================

 * fix errors on invalid input

1.0.0 / 2016-12-04
==================

 * update dependencies

0.1.1 / 2016-12-03
==================

 * use new `object` parser

0.1.0 / 2016-12-02
==================

 * use sax-super-stream module for parsing GPX
 * use furkot-garmin-data module
 * implement GPX parsing using hierarchical parsers
