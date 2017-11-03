/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
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
const Directivity = require('./directivity.js');
const Attenuation = require('./attenuation.js');
const Encoder = require('./encoder.js');
const Utils = require('./utils.js');


/**
 * Options for constructing a new Source.
 * @typedef {Object} Source~SourceOptions
 * @property {Float32Array} position
 * The source's initial position (in meters), where origin is the center of
 * the room. Defaults to {@linkcode Utils.DEFAULT_POSITION DEFAULT_POSITION}.
 * @property {Float32Array} forward
 * The source's initial forward vector. Defaults to
 * {@linkcode Utils.DEFAULT_FORWARD DEFAULT_FORWARD}.
 * @property {Float32Array} up
 * The source's initial up vector. Defaults to
 * {@linkcode Utils.DEFAULT_UP DEFAULT_UP}.
 * @property {Number} minDistance
 * Min. distance (in meters). Defaults to
 * {@linkcode Utils.DEFAULT_MIN_DISTANCE DEFAULT_MIN_DISTANCE}.
 * @property {Number} maxDistance
 * Max. distance (in meters). Defaults to
 * {@linkcode Utils.DEFAULT_MAX_DISTANCE DEFAULT_MAX_DISTANCE}.
 * @property {string} rolloff
 * Rolloff model to use, chosen from options in
 * {@linkcode Utils.ATTENUATION_ROLLOFFS ATTENUATION_ROLLOFFS}. Defaults to
 * {@linkcode Utils.DEFAULT_ATTENUATION_ROLLOFF DEFAULT_ATTENUATION_ROLLOFF}.
 * @property {Number} gain Input gain (linear). Defaults to
 * {@linkcode Utils.DEFAULT_SOURCE_GAIN DEFAULT_SOURCE_GAIN}.
 * @property {Number} alpha Directivity alpha. Defaults to
 * {@linkcode Utils.DEFAULT_DIRECTIVITY_ALPHA DEFAULT_DIRECTIVITY_ALPHA}.
 * @property {Number} sharpness Directivity sharpness. Defaults to
 * {@linkcode Utils.DEFAULT_DIRECTIVITY_SHARPNESS
 * DEFAULT_DIRECTIVITY_SHARPNESS}.
 * @property {Number} sourceWidth
 * Source width (in degrees). Where 0 degrees is a point source and 360 degrees
 * is an omnidirectional source. Defaults to
 * {@linkcode Utils.DEFAULT_SOURCE_WIDTH DEFAULT_SOURCE_WIDTH}.
 */


/**
 * @class Source
 * @description Source model to spatialize an audio buffer.
 * @param {ResonanceAudio} scene Associated {@link ResonanceAudio
 * ResonanceAudio} instance.
 * @param {Source~SourceOptions} options
 * Options for constructing a new Source.
 */
function Source(scene, options) {
  // Public variables.
  /**
   * Mono (1-channel) input {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} input
   * @memberof Source
   * @instance
   */
  /**
   *
   */

  // Use defaults for undefined arguments.
  if (options == undefined) {
    options = {};
  }
  if (options.position == undefined) {
    options.position = Utils.DEFAULT_POSITION.slice();
  }
  if (options.forward == undefined) {
    options.forward = Utils.DEFAULT_FORWARD.slice();
  }
  if (options.up == undefined) {
    options.up = Utils.DEFAULT_UP.slice();
  }
  if (options.minDistance == undefined) {
    options.minDistance = Utils.DEFAULT_MIN_DISTANCE;
  }
  if (options.maxDistance == undefined) {
    options.maxDistance = Utils.DEFAULT_MAX_DISTANCE;
  }
  if (options.rolloff == undefined) {
    options.rolloff = Utils.DEFAULT_ROLLOFF;
  }
  if (options.gain == undefined) {
    options.gain = Utils.DEFAULT_SOURCE_GAIN;
  }
  if (options.alpha == undefined) {
    options.alpha = Utils.DEFAULT_DIRECTIVITY_ALPHA;
  }
  if (options.sharpness == undefined) {
    options.sharpness = Utils.DEFAULT_DIRECTIVITY_SHARPNESS;
  }
  if (options.sourceWidth == undefined) {
    options.sourceWidth = Utils.DEFAULT_SOURCE_WIDTH;
  }

  // Member variables.
  this._scene = scene;
  this._position = options.position;
  this._forward = options.forward;
  this._up = options.up;
  this._dx = new Float32Array(3);
  this._right = Utils.crossProduct(this._forward, this._up);

  // Create audio nodes.
  let context = scene._context;
  this.input = context.createGain();
  this._directivity = new Directivity(context, {
    alpha: options.alpha,
    sharpness: options.sharpness,
  });
  this._toEarly = context.createGain();
  this._toLate = context.createGain();
  this._attenuation = new Attenuation(context, {
    minDistance: options.minDistance,
    maxDistance: options.maxDistance,
    rolloff: options.rolloff,
  });
  this._encoder = new Encoder(context, {
    ambisonicOrder: scene._ambisonicOrder,
    sourceWidth: options.sourceWidth,
  });

  // Connect nodes.
  this.input.connect(this._toLate);
  this._toLate.connect(scene._room.late.input);

  this.input.connect(this._attenuation.input);
  this._attenuation.output.connect(this._toEarly);
  this._toEarly.connect(scene._room.early.input);

  this._attenuation.output.connect(this._directivity.input);
  this._directivity.output.connect(this._encoder.input);

  this._encoder.output.connect(scene._listener.input);

  // Assign initial conditions.
  this.setPosition(
    options.position[0], options.position[1], options.position[2]);
  this.input.gain.value = options.gain;
};


/**
 * Set source's position (in meters), where origin is the center of
 * the room.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Source.prototype.setPosition = function(x, y, z) {
  // Assign new position.
  this._position[0] = x;
  this._position[1] = y;
  this._position[2] = z;

  // Handle far-field effect.
  let distance = this._scene._room.getDistanceOutsideRoom(
    this._position[0], this._position[1], this._position[2]);
    let gain = _computeDistanceOutsideRoom(distance);
  this._toLate.gain.value = gain;
  this._toEarly.gain.value = gain;

  this._update();
};


// Update the source when changing the listener's position.
Source.prototype._update = function() {
  // Compute distance to listener.
  for (let i = 0; i < 3; i++) {
    this._dx[i] = this._position[i] - this._scene._listener.position[i];
  }
  let distance = Math.sqrt(this._dx[0] * this._dx[0] +
    this._dx[1] * this._dx[1] + this._dx[2] * this._dx[2]);
  if (distance > 0) {
    // Normalize direction vector.
    this._dx[0] /= distance;
    this._dx[1] /= distance;
    this._dx[2] /= distance;
  }

  // Compuete angle of direction vector.
  let azimuth = Math.atan2(-this._dx[0], this._dx[2]) *
    Utils.RADIANS_TO_DEGREES;
  let elevation = Math.atan2(this._dx[1], Math.sqrt(this._dx[0] * this._dx[0] +
    this._dx[2] * this._dx[2])) * Utils.RADIANS_TO_DEGREES;

  // Set distance/directivity/direction values.
  this._attenuation.setDistance(distance);
  this._directivity.computeAngle(this._forward, this._dx);
  this._encoder.setDirection(azimuth, elevation);
};


/**
 * Set source's rolloff.
 * @param {string} rolloff
 * Rolloff model to use, chosen from options in
 * {@linkcode Utils.ATTENUATION_ROLLOFFS ATTENUATION_ROLLOFFS}.
 */
Source.prototype.setRolloff = function(rolloff) {
  this._attenuation.setRolloff(rolloff);
};


/**
 * Set source's minimum distance (in meters).
 * @param {Number} minDistance
 */
Source.prototype.setMinDistance = function(minDistance) {
  this._attenuation.minDistance = minDistance;
};


/**
 * Set source's maximum distance (in meters).
 * @param {Number} maxDistance
 */
Source.prototype.setMaxDistance = function(maxDistance) {
  this._attenuation.maxDistance = maxDistance;
};


/**
 * Set source's gain (linear).
 * @param {Number} gain
 */
Source.prototype.setGain = function(gain) {
  this.input.gain.value = gain;
};


/**
 * Set the source's orientation using forward and up vectors.
 * @param {Number} forwardX
 * @param {Number} forwardY
 * @param {Number} forwardZ
 * @param {Number} upX
 * @param {Number} upY
 * @param {Number} upZ
 */
Source.prototype.setOrientation = function(forwardX, forwardY, forwardZ,
    upX, upY, upZ) {
  this._forward[0] = forwardX;
  this._forward[1] = forwardY;
  this._forward[2] = forwardZ;
  this._up[0] = upX;
  this._up[1] = upY;
  this._up[2] = upZ;
  this._right = Utils.crossProduct(this._forward, this._up);
};


// TODO(bitllama): Make sure this works with Three.js as intended.
/**
 * Set source's position and orientation using a
 * Three.js modelViewMatrix object.
 * @param {Float32Array} matrix4
 * The Matrix4 representing the object position and rotation in world space.
 */
Source.prototype.setFromMatrix = function(matrix4) {
  this._right[0] = matrix4.elements[0];
  this._right[1] = matrix4.elements[1];
  this._right[2] = matrix4.elements[2];
  this._up[0] = matrix4.elements[4];
  this._up[1] = matrix4.elements[5];
  this._up[2] = matrix4.elements[6];
  this._forward[0] = matrix4.elements[8];
  this._forward[1] = matrix4.elements[9];
  this._forward[2] = matrix4.elements[10];

  // Normalize to remove scaling.
  this._right = Utils.normalizeVector(this._right);
  this._up = Utils.normalizeVector(this._up);
  this._forward = Utils.normalizeVector(this._forward);

  // Update position.
  this.setPosition(
    matrix4.elements[12], matrix4.elements[13], matrix4.elements[14]);
};


/**
 * Set the source width (in degrees). Where 0 degrees is a point source and 360
 * degrees is an omnidirectional source.
 * @param {Number} sourceWidth (in degrees).
 */
Source.prototype.setSourceWidth = function(sourceWidth) {
  this._encoder.setSourceWidth(sourceWidth);
  this.setPosition(this._position[0], this._position[1], this._position[2]);
};


/**
 * Set source's directivity pattern (defined by alpha), where 0 is an
 * omnidirectional pattern, 1 is a bidirectional pattern, 0.5 is a cardiod
 * pattern. The sharpness of the pattern is increased exponentially.
 * @param {Number} alpha
 * Determines directivity pattern (0 to 1).
 * @param {Number} sharpness
 * Determines the sharpness of the directivity pattern (1 to Inf).
 */
Source.prototype.setDirectivityPattern = function(alpha, sharpness) {
  this._directivity.setPattern(alpha, sharpness);
  this.setPosition(this._position[0], this._position[1], this._position[2]);
};


/**
 * Determine the distance a source is outside of a room. Attenuate gain going
 * to the reflections and reverb when the source is outside of the room.
 * @param {Number} distance Distance in meters.
 * @return {Number} Gain (linear) of source.
 * @private
 */
function _computeDistanceOutsideRoom(distance) {
  // We apply a linear ramp from 1 to 0 as the source is up to 1m outside.
  let gain = 1;
  if (distance > Utils.EPSILON_FLOAT) {
    gain = 1 - distance / Utils.SOURCE_MAX_OUTSIDE_ROOM_DISTANCE;

    // Clamp gain between 0 and 1.
    gain = Math.max(0, Math.min(1, gain));
  }
  return gain;
}


module.exports = Source;
