/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileOverview Compute angles and distances of early reflections.
 */

'use strict';

// Internal dependencies.
var AmbisonicEncoder = require('./ambisonic-encoder.js');
var DistanceFilter = require('./distance-filter.js');

/**
 * @class EarlyReflections
 * @description Compute angles and distances of early reflections.
 * @param {AudioContext} context            Associated AudioContext.
 * @param {Object} options                  Options for object.
 * @param {Array} options.roomDimensions    Room size in meters (3d vector).
 * @param {Number} options.ambisonicOrder   Ambisonic Order.
 * @param {Number} options.speedOfSound     Speed of Sound (in meters / second).
 *                                          Set to 0 to disable delayline.
*/
function EarlyReflections (context, options) {
  this._context = context;

  this._roomDimensionsBy2 = Array(3);
  this._roomDimensionsBy2[0] = options.roomDimensions[0] * 2;
  this._roomDimensionsBy2[1] = options.roomDimensions[1] * 2;
  this._roomDimensionsBy2[2] = options.roomDimensions[2] * 2;
  this._azimuths = Array(7);
  this._elevations = Array(7);
  this._distances = Array(7);
  this._direct = Array(3);
  this._reflect0 = Array(3);
  this._reflect1 = Array(3);
  this._direct_sqr = Array(3);
  this._reflect0_sqr = Array(3);
  this._reflect1_sqr = Array(3);

  this._reflectionGains = Array(7);
  this._distanceFilters = Array(7);
  this._encoders = Array(7);
  this._inputGain = this._context.createGain();
  this._outputGain = this._context.createGain();
  for (var i = 0; i < 7; i++) {
    this._reflectionGains[i] = this._context.createGain();
    this._distanceFilters[i] = new DistanceFilter(context, options.speedOfSound);
    this._encoders[i] = new AmbisonicEncoder(context, options.ambisonicOrder);

    if (i > 0) {
      this._reflectionGains[i].gain.value = 0.8 * Math.pow(-1, i);
    }
    this._distanceFilters[i].setDistance(1);
    this._encoders[i].setDirection(0, 0);

    this._inputGain.connect(this._reflectionGains[i]);
    this._reflectionGains[i].connect(this._distanceFilters[i].input);
    this._distanceFilters[i].output.connect(this._encoders[i].input);
    this._encoders[i].output.connect(this._outputGain);
  }
  this.setPositions([0,0,0],[0,0,0]);

  // Input/Output proxy.
  this.input = this._inputGain;
  this.output = this._outputGain;
}

/**
 * @param {Array} sourcePosition        Source position (3d vector).
 * @param {Array} listenerPosition      Listener position (3d vector).
 */
EarlyReflections.prototype.setPositions = function(sourcePosition, listenerPosition) {
  var rad2deg = 57.295779513082323;

  // Pre-compute vectors.
  for (var i = 0; i < 3; i++) {
    this._direct[i] = sourcePosition[i] - listenerPosition[i];
    this._reflect0[i] = -sourcePosition[i] - listenerPosition[i];
    this._reflect1[i] = this._reflect0[i] + this._roomDimensionsBy2[i];

    this._direct_sqr[i] = this._direct[i] * this._direct[i];
    this._reflect0_sqr[i] = this._reflect0[i] * this._reflect0[i];
    this._reflect1_sqr[i] = this._reflect1[i] * this._reflect1[i];
  }

  // Compute azimuths.
  //TODO(bitllama) Find a cheaper atan2 implementation.
  this._azimuths[0] = Math.atan2(this._direct[1], this._direct[0]) * rad2deg;
  this._azimuths[1] = Math.atan2(this._direct[1], this._reflect0[0]) * rad2deg;
  this._azimuths[2] = Math.atan2(this._reflect0[1], this._direct[0]) * rad2deg;
  this._azimuths[3] = this._azimuths[0];
  this._azimuths[4] = Math.atan2(this._direct[1], this._reflect1[0]) * rad2deg;
  this._azimuths[5] = Math.atan2(this._reflect1[1], this._direct[0]) * rad2deg;
  this._azimuths[6] = this._azimuths[0];

  // Compute elevations.
  var xy_dist = Math.sqrt(this._direct_sqr[0] + this._direct_sqr[1]);
  this._elevations[0] = Math.atan2(this._direct[2], xy_dist) * rad2deg;
  this._elevations[1] = Math.atan2(this._direct[2], Math.sqrt(this._reflect0_sqr[0] + this._direct_sqr[1])) * rad2deg;
  this._elevations[2] = Math.atan2(this._direct[2], Math.sqrt(this._direct_sqr[0] + this._reflect0_sqr[1])) * rad2deg;
  this._elevations[3] = Math.atan2(this._reflect0[2], xy_dist) * rad2deg;
  this._elevations[4] = Math.atan2(this._direct[2], Math.sqrt(this._reflect1_sqr[0] + this._direct_sqr[1])) * rad2deg;
  this._elevations[5] = Math.atan2(this._direct[2], Math.sqrt(this._direct_sqr[0] + this._reflect1_sqr[1])) * rad2deg;
  this._elevations[6] = Math.atan2(this._reflect1[2], xy_dist) * rad2deg;

  // // Compute distances.
  this._distances[0] = Math.sqrt(this._direct_sqr[0] + this._direct_sqr[1] + this._direct_sqr[2]);
  this._distances[1] = Math.sqrt(this._reflect0_sqr[0] + this._direct_sqr[1] + this._direct_sqr[2]);
  this._distances[2] = Math.sqrt(this._direct_sqr[0] + this._reflect0_sqr[1] + this._direct_sqr[2]);
  this._distances[3] = Math.sqrt(this._direct_sqr[0] + this._direct_sqr[1] + this._reflect0_sqr[2]);
  this._distances[4] = Math.sqrt(this._reflect1_sqr[0] + this._direct_sqr[1] + this._direct_sqr[2]);
  this._distances[5] = Math.sqrt(this._direct_sqr[0] + this._reflect1_sqr[1] + this._direct_sqr[2]);
  this._distances[6] = Math.sqrt(this._direct_sqr[0] + this._direct_sqr[1] + this._reflect1_sqr[2]);

  for (var i = 0; i < 7; i++) {
    this._encoders[i].setDirection(0, 0);
    this._encoders[i].setDirection(this._azimuths[i], this._elevations[i]);
    this._distanceFilters[i].setDistance(this._distances[i]);
  }
}

module.exports = EarlyReflections;