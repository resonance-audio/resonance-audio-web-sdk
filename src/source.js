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
 * @file Source model to spatialize an audio buffer.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';

// Internal dependencies.
var Attenuation = require('./attenuation.js');
var AmbisonicEncoder = require('./ambisonic-encoder.js');
var Globals = require('./globals.js');

/**
 * @class Source
 * @description Source model to spatialize an audio buffer.
 * @param {Listener} listener Associated Listener.
 * @param {Object} options
 * @param {Number} options.minDistance Min. distance (in meters).
 * @param {Number} options.maxDistance Max. distance (in meters).
 * @param {Number} options.gain Gain (linear).
 * @param {Float32Array} options.position Position [x,y,z] (in meters).
 * @param {Float32Array} options.velocity Velocity [x,y,z] (in meters).
 * @param {Float32Array} options.orientation Orientation [x,y,z] (in meters).
 */
function Source (listener, options) {
  // Public variables.
  /**
   * Input to .connect() input AudioNodes to.
   * @member {AudioNode} input
   * @memberof Source
   */

  // Assign defaults for undefined options.
  if (options == undefined) {
    options = new Object();
  }
  if (options.gain == undefined) {
    options.gain = Globals.DefaultGainLinear;
  }
  if (options.position == undefined) {
    options.position = Globals.DefaultPosition;
  }
  if (options.velocity == undefined) {
    options.velocity = Globals.DefaultVelocity;
  }
  if (options.orientation == undefined) {
    options.orientation = Globals.DefaultOrientation;
  }

  this._listener = listener;
  this._position = new Float32Array(3);
  this._velocity = new Float32Array(3);
  this._orientation = new Float32Array(3);

  // Create nodes.
  var context = listener._context;
  this.input = context.createGain();
  this._attenuation =
    new Attenuation(context, options);
  this._encoder =
    new AmbisonicEncoder(context, listener._ambisonicOrder);

  // Connect nodes.
  this.input.connect(this._attenuation.input);
  this.input.connect(listener._reverb.input);
  this._attenuation.output.connect(this._encoder.input);
  this._attenuation.output.connect(listener._reflections.input);
  this._encoder.output.connect(listener.output);

  // Assign initial conditions.
  this.setPosition(options.position);
  this.setVelocity(options.velocity);
  this.setOrientation(options.orientation);
  this.input.gain.value = options.gain;
}

/**
 * Set source's position (in meters).
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Source.prototype.setPosition = function(x, y, z) {
  var dx = new Float32Array(3);

  // Assign new position.
  this._position[0] = x;
  this._position[1] = y;
  this._position[2] = z;

  // Compute distance to listener.
  for (var i = 0; i < 3; i++) {
    dx[i] = this._position[i] - this._listener._position[i];
  }
  var distance = Math.sqrt(dx[0] * dx[0] + dx[1] * dx[1] + dx[2] * dx[2]);

  // Normalize direction vector.
  dx[0] /= distance;
  dx[1] /= distance;
  dx[2] /= distance;

  // Compuete angle of direction vector.
  var azimuth = Math.atan2(-dx[0], dx[2]) * Globals.OneEightyByPi;
  var elevation = Math.atan2(dx[1],
    Math.sqrt(dx[0] * dx[0] + dx[2] * dx[2])) * Globals.OneEightyByPi;

  // Set distance/direction values.
  this._attenuation.setDistance(distance);
  this._encoder.setDirection(azimuth, elevation);
}

/**
 * Set source's angle relative to the listener's position.
 * @param {Number} azimuth (in degrees).
 * @param {Number} elevation (in degrees).
 * @param {Number} distance (in meters).
 */
Source.prototype.setAngleFromListener = function(azimuth, elevation, distance) {
  if (elevation == undefined) {
    elevation = 0;
  }
  if (distance == undefined) {
    distance = 1;
  }
  var theta = azimuth * Globals.PiByOneEighty;
  var phi = elevation * Globals.PiByOneEighty;

  // Polar -> Cartesian.
  var x = -Math.sin(theta) * Math.cos(phi);
  var y = Math.sin(theta);
  var z = -Math.cos(theta) * Math.cos(phi);

  // Assign new position based on relationship to listener.
  this._position[0] = this._listener._position[0] + x;
  this._position[1] = this._listener._position[1] + y;
  this._position[2] = this._listener._position[2] + z;

  // Set distance/direction values.
  this._attenuation.setDistance(distance);
  this._encoder.setDirection(-azimuth, elevation);
}

/**
 * Set source's forward orientation.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Source.prototype.setOrientation = function(x, y, z) {
  var radius = Math.sqrt(x * x + y * y + z * z);
  this._orientation[0] = x / radius;
  this._orientation[1] = y / radius;
  this._orientation[2] = z / radius;
}

/**
 * Set source's velocity (in meters/second).
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Source.prototype.setVelocity = function(x, y, z) {
  //TODO(bitllama) Make velocity/doppler thing here.
}

module.exports = Source;