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
 * @file Ray-based room reflections model.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';

// Internal dependencies.
var AmbisonicEncoder = require('./ambisonic-encoder.js');
var Room = require('./room.js');
var Globals = require('./globals.js');

/**
 * @class Reflections
 * @description Ray-based room reflections model.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Object} options
 * @param {Number} options.ambisonicOrder
 * Desired ambisonic order.
 * @param {Map} options.dimensions
 * Room dimensions (in meters).
 * @param {Map} options.coefficients
 * Multiband absorption coeffs per wall.
 * @param {Number} options.speedOfSound
 * (in meters / second) [optional].
 */
function Reflections (context, options) {
  // Public variables.
  /**
   * The room's speed of sound (in meters/second).
   * @member {Number} speedOfSound
   * @memberof Reflections
   */
  /**
   * Input to .connect() input AudioNodes to.
   * @member {AudioNode} input
   * @memberof Reflections
   */
  /**
   * Outuput to .connect() object from.
   * @member {AudioNode} output
   * @memberof Reflections
   */

  this._listenerPosition = new Float32Array(3);

  var wallAzimuthElevation = {
    'left' : [90, 0],
    'right' : [-90, 0],
    'front' : [0, 0],
    'back' : [180, 0],
    'ceiling' : [0, 90],
    'floor' : [0, -90]
  };

  // Assign defaults for undefined options.
  if (options == undefined) {
    options = {};
  }
  if (options.ambisonicOrder == undefined) {
    options.ambisonicOrder = Globals.DefaultAmbisonicOrder;
  }
  if (options.speedOfSound == undefined) {
    options.speedOfSound = Globals.DefaultSpeedOfSound;
  }
  this.speedOfSound = options.speedOfSound;

  // Create nodes.
  this.input = context.createGain();
  this.output = context.createGain();
  this._lowpass = context.createBiquadFilter();
  this._delays = new Array(Room.NumWalls);
  this._gains = new Array(Room.NumWalls);
  this._encoders = new Array(Room.NumWalls);

  // For each wall, we connect a series of [delay] -> [gain] -> [encoder].
  for (var i = 0; i < Room.NumWalls; i++) {
    var key = Room.WallTypes[i];
    this._delays[key] = context.createDelay(Globals.ReflectionsMaxDuration);
    this._gains[key] = context.createGain();
    this._encoders[key] = new AmbisonicEncoder(context, options.ambisonicOrder);
  }

  // Initialize lowpass filter.
  this._lowpass.type = 'lowpass';
  this._lowpass.frequency.value = Globals.DefaultReflectionsCutoffFrequency;
  this._lowpass.Q.value = 0;

  // Initialize encoder directions, set delay times and gains to 0.
  for (var i = 0; i < Room.NumWalls; i++) {
    var key = Room.WallTypes[i];
    this._encoders[key].setDirection(wallAzimuthElevation[key][0],
      wallAzimuthElevation[key][1]);
    this._delays[key].delayTime.value = 0;
    this._gains[key].gain.value = 0;
  }

  // Connect nodes.
  this.input.connect(this._lowpass);
  for (var i = 0; i < Room.NumWalls; i++) {
    var key = Room.WallTypes[i];
    this._lowpass.connect(this._delays[key]);
    this._delays[key].connect(this._gains[key]);
    this._gains[key].connect(this._encoders[key].input);
    this._encoders[key].output.connect(this.output);
  }

  // Initialize.
  this.setRoomProperties(options.dimensions, options.coefficients);
}

/**
 * Set the listener position within the shoebox model.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Reflections.prototype.setListenerPosition = function(x, y, z) {
  //TODO(bitllama): Handle listeners exiting the room!

  // Assign listener position.
  this._listenerPosition = [x, y, z];

  // Determine distances to each wall.
  var distances = {
    'left' : this._halfDimensions['width'] + x,
    'right' : this._halfDimensions['width'] - x,
    'front' : this._halfDimensions['depth'] + z,
    'back' : this._halfDimensions['depth'] - z,
    'floor' : this._halfDimensions['height'] + y,
    'ceiling' : this._halfDimensions['height'] - y,
  };

  // Assign delay & attenuation values using distances.
  for (var i = 0; i < Room.NumWalls; i++) {
    var key = Room.WallTypes[i];

    // Compute and assign delay (in secs).
    var delayInSecs = distances[key] / this.speedOfSound;
    this._delays[key].delayTime.value = delayInSecs;

    // Compute and assign gain, uses logarithmic rolloff: "g = R / (d + 1)"
    var attenuation = this._reflectionCoefficients[key] / (distances[key] + 1);
    this._gains[key].gain.value = attenuation;
  }
}

/**
 * Set the room's properties which determines the characteristics of reflections.
 * @param {Map} dimensions
 * Dimensions map which should conform to the layout of
 * {@link Room.DefaultDimensions Room.DefaultDimensions}
 * @param {Map} coefficients
 * Absorption coefficients map which should contain the keys
 * {@link Room.WallTypes Room.WallTypes}, which each key containing nine (9)
 * values coninciding with desired coefficients for each
 * {@link Globals.ReverbBands frequency band}.
 *
 */
Reflections.prototype.setRoomProperties = function(dimensions, coefficients) {
  // Compute reflection coefficients.
  this._reflectionCoefficients =
    Room.computeReflectionCoefficients(coefficients);

  // Sanitize dimensions and store half-dimensions.
  dimensions = Room.sanitizeDimensions(dimensions);
  this._halfDimensions = {};
  this._halfDimensions['width'] = dimensions['width'] * 0.5;
  this._halfDimensions['height'] = dimensions['height'] * 0.5;
  this._halfDimensions['depth'] = dimensions['depth'] * 0.5;

  // Update listener position with new room properties.
  this.setListenerPosition(this._listenerPosition[0],
    this._listenerPosition[1], this._listenerPosition[2]);
}

module.exports = Reflections;