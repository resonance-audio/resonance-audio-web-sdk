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
 * @fileOverview Source model to spatialize an AudioBuffer.
 */

'use strict';

// Internal dependencies.
var AttenuationFilter = require('./attenuation-filter.js');
var AmbisonicEncoder = require('./ambisonic-encoder.js');

/**
 * @class Source
 * @description Source model to spatialize an AudioBuffer.
 * @param {Listener} listener               Associated Listener.
 * @param {Object} options
 * @param {Number} options.ambisonicOrder   Desired Ambisonic Order.
 *                                          (Default 0).
 * @param {Number} options.minDistance      Min. distance (in meters).
 *                                          (Default 1m).
 * @param {Number} options.maxDistance      Max. distance (in meters).
 *                                          (Default 1000m).
 * @param {Number} options.gain             Gain (in dB). (Default 0dB).
 */
function Source (listener, options) {
  this._context = listener._context;

  if (options.ambisonicOrder == undefined) {
    options.ambisonicOrder = 0;
  }
  if (options.minDistance == undefined) {
    options.minDistance = 1;
  }
  if (options.maxDistance == undefined) {
    options.maxDistance = 1000;
  }
  if (options.gain == undefined) {
    options.gain = 0;
  }

  this._listener = listener;
  this.input = listener._context.createGain();
  this.input.gain.value = Math.pow(10, options.gain / 20);
  this._attenuation =
    new AttenuationFilter(listener._context, options.minDistance,
    options.maxDistance);
  this._encoder = new AmbisonicEncoder(listener._context,
    listener._options.ambisonicOrder);

  this.input.connect(this._attenuation.input);
  this._attenuation.output.connect(this._encoder.input);

  this.input.connect(this._listener.late);
  this._attenuation.output.connect(this._listener.early);
  this._encoder.output.connect(this._listener.output);

  this.position = [0,0,0];
  this.setPosition(this.position[0], this.position[1], this.position[2]);

  // Output proxy.
  this.output = this._encoder.output;
}

/**
 * Set source's position using OpenGL-style cartesian coordinates.
 * @param {Number} x                        Left/Right (in meters).
 * @param {Number} y                        Down/Up (in meters).
 * @param {Number} z                        Forward/Back (in meters).
 */
Source.prototype.setPosition = function(x, y, z) {
  var dx = new Float32Array(3);
  this.position[0] = x;
  this.position[1] = y;
  this.position[2] = z;
  for (var i = 0; i < 3; i++) {
    dx[i] = this.position[i] - this._listener.position[i];
  }
  var distance = Math.sqrt(dx[0] * dx[0] + dx[1] * dx[1] + dx[2] * dx[2]);

  // Normalize direction vector.
  dx[0] /= distance;
  dx[1] /= distance;
  dx[2] /= distance;

  var azimuth = Math.atan2(-dx[0], -dx[2]) * 57.295779513082323;
  var elevation = Math.atan2(dx[1],
    Math.sqrt(dx[0] * dx[0] + dx[2] * dx[2])) * 57.295779513082323;

  this._attenuation.setDistance(distance);
  this._encoder.setDirection(azimuth, elevation);
}

/**
 * Set source's angle relative to the listener's position.
 * @param {Number} azimuth                  Azimuth (in degrees).
 * @param {Number} elevation                Elevation (in degrees).
 * @param {Number} distance                 Distance (in meters).
 */
Source.prototype.setAngleFromListener = function(azimuth, elevation, distance) {
  var phi = azimuth * 0.017453292519943;
  var theta = elevation * 0.017453292519943;

  var x = Math.cos(phi) * Math.cos(theta);
  var y = Math.sin(theta);
  var z = Math.sin(phi) * Math.cos(theta);

  this.position[0] = this._listener.position[0] + x;
  this.position[1] = this._listener.position[1] + y;
  this.position[2] = this._listener.position[2] + z;

  this._attenuation.setDistance(distance);
  this._encoder.setDirection(azimuth, elevation);
}

module.exports = Source;