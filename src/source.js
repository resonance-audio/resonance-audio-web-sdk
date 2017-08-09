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
var Directivity = require('./directivity.js');
var Attenuation = require('./attenuation.js');
var Encoder = require('./encoder.js');
var Utils = require('./utils.js');
//var Room = require('./room.js');

/**
 * @class Source
 * @description Source model to spatialize an audio buffer.
 * @param {Songbird} songbird Associated {@link Songbird Songbird} instance.
 * @param {Object} options
 * @param {Float32Array} options.position
 * The source's initial position (in meters), where origin is the center of
 * the room. Defaults to {@linkcode DEFAULT_POSITION DEFAULT_POSITION}.
 * @param {Float32Array} options.orientation
 * The source's initial orientation (roll, pitch and yaw, in radians). Defaults
 * to {@linkcode DEFAULT_ORIENTATION DEFAULT_ORIENTATION}.
 * @param {Number} options.minDistance
 * Min. distance (in meters). Defaults to
 * {@linkcode Attenuation.MIN_DISTANCE MIN_DISTANCE}.
 * @param {Number} options.maxDistance
 * Max. distance (in meters). Defaults to
 * {@linkcode Attenuation.MAX_DISTANCE MAX_DISTANCE}.
 * @param {string} options.rolloff
 * Rolloff model to use, chosen from options in
 * {@linkcode Attenuation.ROLLOFFS ROLLOFFS}. Defaults to
 * {@linkcode Attenuation.DEFAULT_ROLLOFF DEFAULT_ROLLOFF}.
 * @param {Number} options.gain Input gain (linear). Defaults to
 * {@linkcode Source.DEFAULT_GAIN DEFAULT_GAIN}.
 * @param {Number} options.alpha Directivity alpha. Defaults to
 * {@linkcode Directivity.DEFAULT_ALPHA DEFAULT_ALPHA}.
 * @param {Number} options.exponent Directivity exponent. Defaults to
 * {@linkcode Directivity.DEFAULT_EXPONENT DEFAULT_EXPONENT}.
 * @param {Number} options.sourceWidth
 * Source width (in degrees). Where 0 degrees is a point source and 360 degrees
 * is an omnidirectional source. Defaults to
 * {@linkcode Encoder.DEFAULT_SOURCE_WIDTH DEFAULT_SOURCE_WIDTH}.
 */
function Source (songbird, options) {
  // Public variables.
  /**
   * Mono (1-channel) input {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} input
   * @memberof Source
   * @instance
   */

  // Use defaults for undefined arguments.
  if (options == undefined) {
    options = new Object();
  }
  if (options.position == undefined) {
    options.position = Utils.DEFAULT_POSITION;
  }
  if (options.orientation == undefined) {
    options.orientation = Utils.DEFAULT_ORIENTATION;
  }
  if (options.minDistance == undefined) {
    options.minDistance = Attenuation.DEFAULT_MIN_DISTANCE;
  }
  if (options.maxDistance == undefined) {
    options.maxDistance = Attenuation.DEFAULT_MAX_DISTANCE;
  }
  if (options.rolloff == undefined) {
    options.rolloff = Attenuation.DEFAULT_ROLLOFF;
  }
  if (options.gain == undefined) {
    options.gain = Source.DEFAULT_GAIN;
  }
  if (options.alpha == undefined) {
    options.alpha = Directivity.DEFAULT_ALPHA;
  }
  if (options.exponent == undefined) {
    options.exponent = Directivity.DEFAULT_EXPONENT;
  }
  if (options.sourceWidth == undefined) {
    options.sourceWidth = Encoder.DEFAULT_SOURCE_WIDTH;
  }

  // Member variables.
  this._scene = songbird;
  this._position = new Float32Array(3);
  this._forward = new Float32Array(3);
  this._up = new Float32Array(3);
  this._right = new Float32Array(3);

  // Create audio nodes.
  var context = songbird._context;
  this.input = context.createGain();
  this._directivity = new Directivity(context, {
    alpha: options.alpha,
    exponent: options.exponent
  });
  this._toEarly = context.createGain();
  this._toLate = context.createGain();
  this._attenuation = new Attenuation(context, {
    minDistance: options.minDistance,
    maxDistance: options.maxDistance,
    rolloff: options.rolloff
  });
  this._encoder = new Encoder(context, {
    ambisonicOrder: songbird._ambisonicOrder,
    sourceWidth: options.sourceWidth
  });

  // Connect nodes.
  this.input.connect(this._toLate);

  // Only connect if late reflections isn't disabled.
  if (songbird._room._useLateReflections) {
    this._toLate.connect(songbird._room.late.input);
  }

  this.input.connect(this._attenuation.input);
  this._attenuation.output.connect(this._toEarly);
  this._toEarly.connect(songbird._room.early.input);

  this._attenuation.output.connect(this._directivity.input);
  this._directivity.output.connect(this._encoder.input);
  this._encoder.output.connect(songbird._listener.input);

  // Assign initial conditions.
  this.setPosition(options.position[0], options.position[1],
    options.position[2]);
  this.setOrientation(options.orientation[0], options.orientation[1],
    options.orientation[2]);
  this.input.gain.value = options.gain;
}

/**
 * Set source's position (in meters), where origin is the center of
 * the room.
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

  // Handle far-field effect.
  var distance = this._scene._room.getDistanceOutsideRoom(
    this._position[0], this._position[1], this._position[2]);
  var gain = _computeDistanceOutsideRoom(distance);
  this._toLate.gain.value = gain;
  this._toEarly.gain.value = gain;

  // Compute distance to listener.
  for (var i = 0; i < 3; i++) {
    dx[i] = this._position[i] - this._scene._listener.position[i];
  }
  var distance = Math.sqrt(dx[0] * dx[0] + dx[1] * dx[1] + dx[2] * dx[2]);

  // Normalize direction vector.
  dx[0] /= distance;
  dx[1] /= distance;
  dx[2] /= distance;

  // Compuete angle of direction vector.
  var azimuth = Math.atan2(-dx[0], dx[2]) * Utils.RADIANS_TO_DEGREES;
  var elevation = Math.atan2(dx[1],
    Math.sqrt(dx[0] * dx[0] + dx[2] * dx[2])) * Utils.RADIANS_TO_DEGREES;

  // Set distance/directivity/direction values.
  this._attenuation.setDistance(distance);
  this._directivity.computeAngle(this._forward, dx);
  this._encoder.setDirection(azimuth, elevation);
}

/**
 * Set source's angle relative to the listener's position.
 * Azimuth is counterclockwise (0-360). Elevation range is 90 to -90.
 * @param {Number} azimuth (in degrees). Defaults to
 * {@linkcode Encoder.DEFAULT_AZIMUTH DEFAULT_AZIMUTH}.
 * @param {Number} elevation (in degrees). Defaults to
 * {@linkcode Encoder.DEFAULT_ELEVATION DEFAULT_ELEVATION}.
 * @param {Number} distance (in meters). Defaults to
 * {@linkcode Source.DEFAULT_DISTANCE DEFAULT_DISTANCE}.
 */
Source.prototype.setAngleFromListener = function (azimuth, elevation,
                                                  distance) {
  // Use defaults for undefined arguments.
  if (azimuth == undefined) {
    azimuth = Attenuation.DEFAULT_AZIMUTH;
  }
  if (elevation == undefined) {
    elevation = Attenuation.DEFAULT_ELEVATION;
  }
  if (distance == undefined) {
    distance = Source.DEFAULT_DISTANCE;
  }
  var theta = azimuth * Utils.DEGREES_TO_RADIANS;
  var phi = elevation * Utils.DEGREES_TO_RADIANS;

  // Polar -> Cartesian (direction from listener).
  var x = Math.sin(theta) * Math.cos(phi);
  var y = Math.sin(phi);
  var z = -Math.cos(theta) * Math.cos(phi);

  // Assign new position based on relationship to listener.
  this._position[0] = this._scene._listener.position[0] + x;
  this._position[1] = this._scene._listener.position[1] + y;
  this._position[2] = this._scene._listener.position[2] + z;

  // Handle far-field effect.
  var distance = this._scene._room.getDistanceOutsideRoom(
    this._position[0], this._position[1], this._position[2]);
  var gain = _computeDistanceOutsideRoom(distance);
  this._toLate.gain.value = gain;
  this._toEarly.gain.value = gain;

  // Set distance/directivity/direction values.
  this._attenuation.setDistance(distance);
  this._directivity.computeAngle(this._forward, [x, y, z]);
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
  this._forward = Utils.rotateVector(Utils.DEFAULT_FORWARD, q);
  this._up = Utils.rotateVector(Utils.DEFAULT_UP, q);
  this._right = Utils.rotateVector(Utils.DEFAULT_RIGHT, q);
  this.setPosition(this._position[0], this._position[1], this._position[2]);
}

/**
 * Set the source width (in degrees). Where 0 degrees is a point source and 360
 * degrees is an omnidirectional source.
 * @param {Number} sourceWidth (in degrees).
 */
Source.prototype.setSourceWidth = function (sourceWidth) {
  this._encoder.setSourceWidth(sourceWidth);
  this.setPosition(this._position[0], this._position[1], this._position[2]);
}

/**
 * Set source's directivity pattern (defined by alpha), where 0 is an
 * omnidirectional pattern, 1 is a bidirectional pattern, 0.5 is a cardiod
 * pattern. The sharpness of the pattern is increased with the exponent.
 * @param {Number} alpha
 * Determines directivity pattern (0 to 1).
 * @param {Number} exponent
 * Determines the steepness of the directivity pattern (1 to Inf).
 */
Source.prototype.setDirectivityPattern = function (alpha, exponent) {
  this._directivity.setPattern(alpha, exponent);
  this.setPosition(this._position[0], this._position[1], this._position[2]);
}

// Helper functions.
// Determine the distance a source is outside of a room. Attenuate gain going
// to the reflections and reverb when the source is outside of the room.
function _computeDistanceOutsideRoom (distance)
{
  // We apply a linear ramp from 1 to 0 as the source is up to 1m outside.
  var gain = 1;
  if (distance > Utils.EPSILON_FLOAT) {
    gain = 1 - distance / Source.MAX_OUTSIDE_ROOM_DISTANCE;

    // Clamp gain between 0 and 1.
    gain = Math.max(0, Math.min(1, gain));
  }
  return gain;
}

// Static constants.
/**
 * Default input gain (linear).
 * @type {Number}
 */
Source.DEFAULT_GAIN = 1;
/**
 * Default distance from listener when setting angle.
 * @type {Number}
 */
Source.DEFAULT_DISTANCE = 1;
/**
 * Maximum outside-the-room distance to attenuate far-field sources by.
 * @type {Number}
 */
Source.MAX_OUTSIDE_ROOM_DISTANCE = 1;

module.exports = Source;