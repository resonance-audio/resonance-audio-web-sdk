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
 * @file Songbird library name space and common utilities.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';

// Internal dependencies.
var Listener = require('./listener.js');
var Source = require('./source.js');
var Room = require('./room.js');
var EarlyReflections = require('./early-reflections.js');
var Encoder = require('./encoder.js');
var Utils = require('./utils.js');

/**
 * @class Songbird spatial audio.
 * @description Main class for managing sources, room and listener models.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Object} options
 * @param {Number} options.ambisonicOrder
 * Desired ambisonic Order. Defaults to
 * {@linkcode Encoder.DEFAULT_AMBISONIC_ORDER DEFAULT_AMBISONIC_ORDER}.
 * @param {Float32Array} options.listenerPosition
 * The listener's initial position (in meters), where origin is the center of
 * the room. Defaults to {@linkcode DEFAULT_POSITION DEFAULT_POSITION}.
 * @param {Float32Array} options.listenerOrientation
 * The listener's initial orientation (roll, pitch and yaw, in radians).
 * Defaults to {@linkcode DEFAULT_ORIENTATION DEFAULT_ORIENTATION}.
 * @param {Object} options.dimensions Room dimensions (in meters). Defaults to
 * {@linkcode EarlyReflections.DEFAULT_DIMENSIONS DEFAULT_DIMENSIONS}.
 * @param {Object} options.materials Named acoustic materials per wall.
 * Defaults to {@linkcode Room.DEFAULT_MATERIALS DEFAULT_MATERIALS}.
 * @param {Number} options.speedOfSound
 * (in meters/second). Defaults to
 * {@linkcode DEFAULT_SPEED_OF_SOUND DEFAULT_SPEED_OF_SOUND}.
 * @param {Boolean} options.useLateReflections Enables/disables
 * {@link LateReflections LateReflections}, which uses a convolution reverb.
 * Can be disabled to improve performance on low-power devices. Defaults to
 * {@linkcode Room.USE_LATE_REFLECTIONS USE_LATE_REFLECTIONS}.
 */
function Songbird (context, options) {
  // Public variables.
  /**
   * Binaurally-rendered stereo (2-channel) output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} output
   * @memberof Songbird
   * @instance
   */
  /**
   * Ambisonic (multichannel) output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} ambisonicOutput
   * @memberof Songbird
   * @instance
   */

  // Use defaults for undefined arguments.
  if (options == undefined) {
    options = new Object();
  }
  if (options.ambisonicOrder == undefined) {
    options.ambisonicOrder = Encoder.DEFAULT_AMBISONIC_ORDER;
  }
  if (options.listenerPosition == undefined) {
    options.listenerPosition = Utils.DEFAULT_POSITION;
  }
  if (options.listenerOrientation == undefined) {
    options.listenerOrientation = Utils.DEFAULT_ORIENTATION;
  }
  if (options.dimensions == undefined) {
    options.dimensions = EarlyReflections.DEFAULT_DIMENSIONS;
  }
  if (options.materials == undefined) {
    options.materials = Room.DEFAULT_MATERIALS;
  }
  if (options.speedOfSound == undefined) {
    options.speedOfSound = Utils.DEFAULT_SPEED_OF_SOUND;
  }
  if (options.useLateReflections == undefined) {
    options.useLateReflections = Room.USE_LATE_REFLECTIONS;
  }

  // Member variables.
  this._ambisonicOrder = options.ambisonicOrder;

  // Create member submodules.
  this._sources = [];
  this._room = new Room(context, {
    listenerPosition: options.listenerPosition,
    dimensions: options.dimensions,
    materials: options.materials,
    speedOfSound: options.speedOfSound
  });
  this._listener = new Listener(context, {
    ambisonicOrder: options.ambisonicOrder,
    position: options.listenerPosition,
    orientation: options.listenerOrientation
  });

  // Create auxillary audio nodes.
  this._context = context;
  this.output = context.createGain();
  this.ambisonicOutput = context.createGain();

  // Connect audio graph.
  this._room.output.connect(this._listener.input);
  this._listener.output.connect(this.output);
  this._listener.ambisonicOutput.connect(this.ambisonicOutput);
}

/**
 * Create a new source for the scene.
 * @param {Object} options
 * @param {Float32Array} options.position
 * The source's initial position (in meters), where origin is the center of
 * the room. Defaults to {@linkcode DEFAULT_POSITION DEFAULT_POSITION}.
 * @param {Float32Array} options.orientation
 * The source's initial orientation (roll, pitch and yaw, in radians). Defaults
 * to {@linkcode DEFAULT_ORIENTATION DEFAULT_ORIENTATION}.
 * @param {Number} options.minDistance
 * Min. distance (in meters). Defaults to
 * {@linkcode Attenuation.DEFAULT_MIN_DISTANCE DEFAULT_MIN_DISTANCE}.
 * @param {Number} options.maxDistance
 * Max. distance (in meters). Defaults to
 * {@linkcode Attenuation.DEFAULT_MAX_DISTANCE DEFAULT_MAX_DISTANCE}.
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
 */
Songbird.prototype.createSource = function (options) {
  // Create a source and push it to the internal sources array, returning
  // the object's reference to the user.
  this._sources.push(new Source(this, options));
  return this._sources[this._sources.length - 1];
}

/**
 * Set the room's dimensions and wall materials.
 * @param {Object} dimensions Room dimensions (in meters). Defaults to
 * {@linkcode EarlyReflections.DEFAULT_DIMENSIONS DEFAULT_DIMENSIONS}.
 * @param {Object} materials Named acoustic materials per wall. Defaults to
 * {@linkcode Room.DEFAULT_MATERIALS DEFAULT_MATERIALS}.
 */
Songbird.prototype.setRoomProperties = function (dimensions, materials) {
  this._room.setProperties(dimensions, materials);
}

/**
 * Set the listener's position (in meters), where origin is the center of
 * the room.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Songbird.prototype.setListenerPosition = function (x, y, z) {
  this._listener.position[0] = x;
  this._listener.position[1] = y;
  this._listener.position[2] = z;
  this._room.setListenerPosition(x, y, z);
  for (var i = 0; i < this._sources.length; i++) {
    this._sources[i].setPosition(this._sources[i]._position[0],
      this._sources[i]._position[1], this._sources[i]._position[2]);
  }
}

/**
 * Set the listener's orientation (in radians).
 * @param {Number} roll
 * @param {Number} pitch
 * @param {Number} yaw
 */
Songbird.prototype.setListenerOrientation = function (roll, pitch, yaw) {
  this._listener.setOrientation(roll, pitch, yaw);
}

/**
 * Set the listener's position and orientation using a Three.js camera object.
 * @param {Object} cameraMatrix
 * The Matrix4 object of the Three.js camera.
 */
Songbird.prototype.setListenerFromCamera = function (cameraMatrix) {
  // Compute listener orientation from camera matrix, extract position.
  this._listener.setFromCamera(cameraMatrix);

  // Update the rest of the scene using new listener position.
  this.setListenerPosition(this._listener.position[0],
    this._listener.position[1], this._listener.position[2]);
}

module.exports = Songbird;
