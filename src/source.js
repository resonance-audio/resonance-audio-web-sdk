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
var Encoder = require('./encoder.js');
var Global = require('./global.js');
var Utils = require('./utils.js');

/**
 * @class Source
 * @description Source model to spatialize an audio buffer.
 * @param {Listener} listener Associated Listener.
 * @param {Object} options
 * @param {Number} options.minDistance Min. distance (in meters).
 * @param {Number} options.maxDistance Max. distance (in meters).
 * @param {Number} options.gain Gain (linear).
 * @param {Float32Array} options.position
 * Position [x,y,z] (in meters).
 * @param {Float32Array} options.orientation
 * Orientation [roll, pitch, yaw] (in radians).
 * @param {string} options.rolloff
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
    options.gain = Global.DEFAULT_GAIN_LINEAR;
  }
  if (options.position == undefined) {
    options.position = Global.DEFAULT_POSITION;
  }
  if (options.orientation == undefined) {
    options.orientation = Global.DEFAULT_ORIENTATION;
  }
  if (options.rolloff == undefined) {
    options.rolloff = Attenuation.DEFAULT_ROLLOFF_MODEL;
  }

  this._listener = listener;
  this._position = new Float32Array(3);
  this._forward = new Float32Array(3);
  this._up = new Float32Array(3);
  this._right = new Float32Array(3);
  this._directivity_alpha = 0;
  this._directivity_order = 1;

  // Create nodes.
  var context = listener._context;
  this.input = context.createGain();
  this._directivity = context.createBiquadFilter();
  this._toEarly = context.createGain();
  this._toLate = context.createGain();
  this._attenuation =
    new Attenuation(context, options);
  this._encoder =
    new Encoder(context, listener._ambisonicOrder);

  // Initialize Directivity filter.
  this._directivity.type = 'lowpass';
  this._directivity.Q.value = 0;
  this._directivity.frequency.value = listener._context.sampleRate * 0.5;

  // Connect nodes.
  this.input.connect(this._toLate);
  this._toLate.connect(listener._room.late.input);

  this.input.connect(this._attenuation.input);
  this._attenuation.output.connect(this._toEarly);
  this._toEarly.connect(listener._room.early.input);

  this._attenuation.output.connect(this._directivity);
  this._directivity.connect(this._encoder.input);
  this._encoder.output.connect(listener.output);

  // Assign initial conditions.
  this.setPosition(options.position[0], options.position[1],
    options.position[2]);
  this.setOrientation(options.orientation[0], options.orientation[1],
    options.orientation[2]);
  this.input.gain.value = options.gain;
}

/**
 * Set source's position (in meters).
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Source.prototype.setPosition = function (x, y, z) {
  var dx = new Float32Array(3);

  // Assign new position.
  this._position[0] = x;
  this._position[1] = y;
  this._position[2] = z;
  this._computeDistanceOutsideRoom();

  // Compute distance to listener.
  for (var i = 0; i < 3; i++) {
    dx[i] = this._position[i] - this._listener._position[i];
  }
  var distance = Math.sqrt(dx[0] * dx[0] + dx[1] * dx[1] + dx[2] * dx[2]);

  // Normalize direction vector.
  dx[0] /= distance;
  dx[1] /= distance;
  dx[2] /= distance;

  // Compute directivity pattern.
  this._computeDirectivity(dx);

  // Compuete angle of direction vector.
  var azimuth = Math.atan2(-dx[0], dx[2]) * Global.RADIANS_TO_DEGREES;
  var elevation = Math.atan2(dx[1],
    Math.sqrt(dx[0] * dx[0] + dx[2] * dx[2])) * Global.RADIANS_TO_DEGREES;

  // Set distance/direction values.
  this._attenuation.setDistance(distance);
  this._encoder.setDirection(azimuth, elevation);
}

/**
 * Set source's angle relative to the listener's position.
 * Azimuth is counterclockwise (0-360). Elevation range is 90 to -90.
 * @param {Number} azimuth (in degrees).
 * @param {Number} elevation (in degrees) [defaults to 0].
 * @param {Number} distance (in meters) [defaults to 1].
 */
Source.prototype.setAngleFromListener = function (azimuth, elevation,
                                                  distance) {
  if (azimuth == undefined) {
    azimuth = Attenuation.DEFAULT_AZIMUTH;
  }
  if (elevation == undefined) {
    elevation = Attenuation.DEFAULT_ELEVATION;
  }
  if (distance == undefined) {
    distance = Source.DEFAULT_DISTANCE;
  }
  var theta = azimuth * Global.DEGREES_TO_RADIANS;
  var phi = elevation * Global.DEGREES_TO_RADIANS;

  // Polar -> Cartesian (direction from listener).
  var x = Math.sin(theta) * Math.cos(phi);
  var y = Math.sin(phi);
  var z = -Math.cos(theta) * Math.cos(phi);

  // Compute directivity pattern.
  this._computeDirectivity([x, y, z]);

  // Assign new position based on relationship to listener.
  this._position[0] = this._listener._position[0] + x;
  this._position[1] = this._listener._position[1] + y;
  this._position[2] = this._listener._position[2] + z;
  this._computeDistanceOutsideRoom();

  // Set distance/direction values.
  this._attenuation.setDistance(distance);
  this._encoder.setDirection(azimuth, elevation);
}

/**
 * Set source's orientation (in radians).
 * @param {Number} roll
 * @param {Number} pitch
 * @param {Number} yaw
 */
Source.prototype.setOrientation = function (roll, pitch, yaw) {
  var q = Utils.toQuaternion(roll, pitch, yaw);
  this._forward = Utils.rotateVector(Global.DEFAULT_FORWARD, q);
  this._up = Utils.rotateVector(Global.DEFAULT_UP, q);
  this._right = Utils.rotateVector(Global.DEFAULT_RIGHT, q);
}

Source.prototype.setSpread = function (spread) {
}

/**
 * Set source's directivity pattern (defined by alpha), where 0 is an
 * omnidirectional pattern, 1 is a bidirectional pattern, 0.5 is a cardiod
 * pattern. The sharpness of the pattern is increased with order.
 * @param {Number} alpha
 * Determines directivity pattern (0 to 1).
 * @param {Number} order
 * Determines the steepness of the directivity pattern (1 to Inf).
 */
Source.prototype.setDirectivity = function (alpha, order) {
  // Clamp between 0 and 1.
  this._directivity_alpha = Math.min(1, Math.max(0, alpha));

  if (order !== undefined) {
    // Clamp between 1 and Inf.
    this._directivity_order = Math.min(1, order);
  }
}

// Compute directivity using standard microphone patterns.
// Assign coeff to control a lowpass filter.
Source.prototype._computeDirectivity = function (direction_to_listener) {
  var coeff = 1.0;
  if (this._directivity_alpha > Global.EPSILON_FLOAT) {
    var cosTheta = this._forward[0] * direction_to_listener[0] +
      this._forward[1] * direction_to_listener[1] +
      this._forward[2] * direction_to_listener[2];
    coeff = (1 - this._directivity_alpha) + this._directivity_alpha * cosTheta;
    coeff = Math.pow(Math.abs(coeff), this._directivity_order);
  }

  // Apply low-pass filter.
  this._directivity.frequency.value =
    this._listener._context.sampleRate * 0.5 * coeff;
}

// Determine the distance a source is outside of a room. Attenuate gain going
// to the reflections and reverb when the source is outside of the room.
Source.prototype._computeDistanceOutsideRoom = function ()
{
  var dx = Math.max(0,
    -this._listener._room.early._halfDimensions['width'] - this._position[0],
    this._position[0] - this._listener._room.early._halfDimensions['width']);
  var dy = Math.max(0,
    -this._listener._room.early._halfDimensions['height'] - this._position[1],
    this._position[1] - this._listener._room.early._halfDimensions['height']);
  var dz = Math.max(0,
    -this._listener._room.early._halfDimensions['depth'] - this._position[2],
    this._position[2] - this._listener._room.early._halfDimensions['depth']);
  var distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // We apply a linear ramp from 1 to 0 as the source is up to 1m outside.
  var gain = 1;
  if (distance > Global.EPSILON_FLOAT) {
    gain = Math.max(1, 1 - distance);
  }
  this._toLate.gain.value = gain;
  this._toEarly.gain.value = gain;
}

/** @type {Number} */
Source.DEFAULT_DISTANCE = 1;

module.exports = Source;