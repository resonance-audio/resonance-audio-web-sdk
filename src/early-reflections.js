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
 * @file Ray-tracing-based early reflections model.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';

// Internal dependencies.
const Utils = require('./utils.js');


/**
 * @class EarlyReflections
 * @description Ray-tracing-based early reflections model.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Object} options
 * @param {Utils~RoomDimensions} options.dimensions
 * Room dimensions (in meters). Defaults to
 * {@linkcode Utils.DEFAULT_ROOM_DIMENSIONS DEFAULT_ROOM_DIMENSIONS}.
 * @param {Object} options.coefficients
 * Frequency-independent reflection coeffs per wall. Defaults to
 * {@linkcode Utils.DEFAULT_REFLECTION_COEFFICIENTS
 * DEFAULT_REFLECTION_COEFFICIENTS}.
 * @param {Number} options.speedOfSound
 * (in meters / second). Defaults to {@linkcode Utils.DEFAULT_SPEED_OF_SOUND
 * DEFAULT_SPEED_OF_SOUND}.
 * @param {Float32Array} options.listenerPosition
 * (in meters). Defaults to
 * {@linkcode Utils.DEFAULT_POSITION DEFAULT_POSITION}.
 */
function EarlyReflections(context, options) {
  // Public variables.
  /**
   * The room's speed of sound (in meters/second).
   * @member {Number} speedOfSound
   * @memberof EarlyReflections
   * @instance
   */
  /**
   * Mono (1-channel) input {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} input
   * @memberof EarlyReflections
   * @instance
   */
  /**
   * First-order ambisonic (4-channel) output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} output
   * @memberof EarlyReflections
   * @instance
   */

  // Use defaults for undefined arguments.
  if (options == undefined) {
    options = {};
  }
  if (options.speedOfSound == undefined) {
    options.speedOfSound = Utils.DEFAULT_SPEED_OF_SOUND;
  }
  if (options.listenerPosition == undefined) {
    options.listenerPosition = Utils.DEFAULT_POSITION.slice();
  }
  if (options.coefficients == undefined) {
    options.coefficients = {};
    Object.assign(options.coefficients, Utils.DEFAULT_REFLECTION_COEFFICIENTS);
  }

  // Assign room's speed of sound.
  this.speedOfSound = options.speedOfSound;

  // Create nodes.
  this.input = context.createGain();
  this.output = context.createGain();
  this._lowpass = context.createBiquadFilter();
  this._delays = {};
  this._gains = {}; // gainPerWall = (ReflectionCoeff / Attenuation)
  this._inverters = {}; // 3 of these are needed for right/back/down walls.
  this._merger = context.createChannelMerger(4); // First-order encoding only.

  // Connect audio graph for each wall reflection.
  for (let property in Utils.DEFAULT_REFLECTION_COEFFICIENTS) {
    if (Utils.DEFAULT_REFLECTION_COEFFICIENTS
        .hasOwnProperty(property)) {
      this._delays[property] =
        context.createDelay(Utils.MAX_DURATION);
      this._gains[property] = context.createGain();
    }
  }
  this._inverters.right = context.createGain();
  this._inverters.down = context.createGain();
  this._inverters.back = context.createGain();

  // Initialize lowpass filter.
  this._lowpass.type = 'lowpass';
  this._lowpass.frequency.value = Utils.DEFAULT_REFLECTION_CUTOFF_FREQUENCY;
  this._lowpass.Q.value = 0;

  // Initialize encoder directions, set delay times and gains to 0.
  for (let property in Utils.DEFAULT_REFLECTION_COEFFICIENTS) {
    if (Utils.DEFAULT_REFLECTION_COEFFICIENTS
        .hasOwnProperty(property)) {
      this._delays[property].delayTime.value = 0;
      this._gains[property].gain.value = 0;
    }
  }

  // Initialize inverters for opposite walls ('right', 'down', 'back' only).
  this._inverters.right.gain.value = -1;
  this._inverters.down.gain.value = -1;
  this._inverters.back.gain.value = -1;

  // Connect nodes.
  this.input.connect(this._lowpass);
  for (let property in Utils.DEFAULT_REFLECTION_COEFFICIENTS) {
    if (Utils.DEFAULT_REFLECTION_COEFFICIENTS
        .hasOwnProperty(property)) {
      this._lowpass.connect(this._delays[property]);
      this._delays[property].connect(this._gains[property]);
      this._gains[property].connect(this._merger, 0, 0);
    }
  }

  // Connect gains to ambisonic channel output.
  // Left: [1 1 0 0]
  // Right: [1 -1 0 0]
  // Up: [1 0 1 0]
  // Down: [1 0 -1 0]
  // Front: [1 0 0 1]
  // Back: [1 0 0 -1]
  this._gains.left.connect(this._merger, 0, 1);

  this._gains.right.connect(this._inverters.right);
  this._inverters.right.connect(this._merger, 0, 1);

  this._gains.up.connect(this._merger, 0, 2);

  this._gains.down.connect(this._inverters.down);
  this._inverters.down.connect(this._merger, 0, 2);

  this._gains.front.connect(this._merger, 0, 3);

  this._gains.back.connect(this._inverters.back);
  this._inverters.back.connect(this._merger, 0, 3);
  this._merger.connect(this.output);

  // Initialize.
  this._listenerPosition = options.listenerPosition;
  this.setRoomProperties(options.dimensions, options.coefficients);
}


/**
 * Set the listener's position (in meters),
 * where [0,0,0] is the center of the room.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
EarlyReflections.prototype.setListenerPosition = function(x, y, z) {
  // Assign listener position.
  this._listenerPosition = [x, y, z];

  // Determine distances to each wall.
  let distances = {
    left: Utils.DEFAULT_REFLECTION_MULTIPLIER * Math.max(0,
      this._halfDimensions.width + x) + Utils.DEFAULT_REFLECTION_MIN_DISTANCE,
    right: Utils.DEFAULT_REFLECTION_MULTIPLIER * Math.max(0,
      this._halfDimensions.width - x) + Utils.DEFAULT_REFLECTION_MIN_DISTANCE,
    front: Utils.DEFAULT_REFLECTION_MULTIPLIER * Math.max(0,
      this._halfDimensions.depth + z) + Utils.DEFAULT_REFLECTION_MIN_DISTANCE,
    back: Utils.DEFAULT_REFLECTION_MULTIPLIER * Math.max(0,
      this._halfDimensions.depth - z) + Utils.DEFAULT_REFLECTION_MIN_DISTANCE,
    down: Utils.DEFAULT_REFLECTION_MULTIPLIER * Math.max(0,
      this._halfDimensions.height + y) + Utils.DEFAULT_REFLECTION_MIN_DISTANCE,
    up: Utils.DEFAULT_REFLECTION_MULTIPLIER * Math.max(0,
      this._halfDimensions.height - y) + Utils.DEFAULT_REFLECTION_MIN_DISTANCE,
  };

  // Assign delay & attenuation values using distances.
  for (let property in Utils.DEFAULT_REFLECTION_COEFFICIENTS) {
    if (Utils.DEFAULT_REFLECTION_COEFFICIENTS
        .hasOwnProperty(property)) {
      // Compute and assign delay (in seconds).
      let delayInSecs = distances[property] / this.speedOfSound;
      this._delays[property].delayTime.value = delayInSecs;

      // Compute and assign gain, uses logarithmic rolloff: "g = R / (d + 1)"
      let attenuation = this._coefficients[property] / distances[property];
      this._gains[property].gain.value = attenuation;
    }
  }
};


/**
 * Set the room's properties which determines the characteristics of
 * reflections.
 * @param {Utils~RoomDimensions} dimensions
 * Room dimensions (in meters). Defaults to
 * {@linkcode Utils.DEFAULT_ROOM_DIMENSIONS DEFAULT_ROOM_DIMENSIONS}.
 * @param {Object} coefficients
 * Frequency-independent reflection coeffs per wall. Defaults to
 * {@linkcode Utils.DEFAULT_REFLECTION_COEFFICIENTS
 * DEFAULT_REFLECTION_COEFFICIENTS}.
 */
EarlyReflections.prototype.setRoomProperties = function(dimensions,
                                                        coefficients) {
  if (dimensions == undefined) {
    dimensions = {};
    Object.assign(dimensions, Utils.DEFAULT_ROOM_DIMENSIONS);
  }
  if (coefficients == undefined) {
    coefficients = {};
    Object.assign(coefficients, Utils.DEFAULT_REFLECTION_COEFFICIENTS);
  }
  this._coefficients = coefficients;

  // Sanitize dimensions and store half-dimensions.
  this._halfDimensions = {};
  this._halfDimensions.width = dimensions.width * 0.5;
  this._halfDimensions.height = dimensions.height * 0.5;
  this._halfDimensions.depth = dimensions.depth * 0.5;

  // Update listener position with new room properties.
  this.setListenerPosition(this._listenerPosition[0],
    this._listenerPosition[1], this._listenerPosition[2]);
};


module.exports = EarlyReflections;
