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
 * @param {Number} options.minDistance      Min. distance (in meters).
 * @param {Number} options.maxDistance      Max. distance (in meters).
 * @param {Number} options.gain             Gain (linear).
 */
function Source (listener, options) {
  this._context = listener._context;

  this._listener = listener;
  this.input = listener._context.createGain();
  this.input.gain.value = options.gain;
  this._attenuation =
    new AttenuationFilter(listener._context, options.minDistance, options.maxDistance);
  this._encoder = new AmbisonicEncoder(listener._context, options.ambisonicOrder);
  this.position = [0,0,0];

  this.input.connect(this._attenuation.input);
  this._attenuation.output.connect(this._encoder.input);

  this.input.connect(this._listener.late);
  this._attenuation.output.connect(this._listener.early);
  this._encoder.output.connect(this._listener.output);

  this.setPosition(this.position[0], this.position[1], this.position[2]);

  // Output proxy.
  this.output = this._encoder.output;
}

Source.prototype.setPosition = function(x, y, z) {
  var dx = new Float32Array(3);
  this.position[0] = x;
  this.position[1] = y;
  this.position[2] = z;
  for (var i = 0; i < 3; i++) {
    dx[i] = this.position[i] - this._listener.position[i];
  }
  var radius = Math.sqrt(dx[0] * dx[0] + dx[1] * dx[1] + dx[2] * dx[2]);

  // Normalize direction vector.
  dx[0] /= radius;
  dx[1] /= radius;
  dx[2] /= radius;

  var azimuth = Math.atan2(-dx[0], -dx[2]) * 57.295779513082323;
  var elevation = Math.atan2(dx[1],
    Math.sqrt(dx[0] * dx[0] + dx[2] * dx[2])) * 57.295779513082323;
  this._attenuation.setDistance(radius);
  this._encoder.setDirection(azimuth, elevation);
}

module.exports = Source;