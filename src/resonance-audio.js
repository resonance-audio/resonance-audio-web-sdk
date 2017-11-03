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
 * @file ResonanceAudio library name space and common utilities.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';


// Internal dependencies.
const Listener = require('./listener.js');
const Source = require('./source.js');
const Room = require('./room.js');
const Encoder = require('./encoder.js');
const Utils = require('./utils.js');


/**
 * Options for constructing a new ResonanceAudio scene.
 * @typedef {Object} ResonanceAudio~ResonanceAudioOptions
 * @property {Number} ambisonicOrder
 * Desired ambisonic Order. Defaults to
 * {@linkcode Utils.DEFAULT_AMBISONIC_ORDER DEFAULT_AMBISONIC_ORDER}.
 * @property {Float32Array} listenerPosition
 * The listener's initial position (in meters), where origin is the center of
 * the room. Defaults to {@linkcode Utils.DEFAULT_POSITION DEFAULT_POSITION}.
 * @property {Float32Array} listenerForward
 * The listener's initial forward vector.
 * Defaults to {@linkcode Utils.DEFAULT_FORWARD DEFAULT_FORWARD}.
 * @property {Float32Array} listenerUp
 * The listener's initial up vector.
 * Defaults to {@linkcode Utils.DEFAULT_UP DEFAULT_UP}.
 * @property {Utils~RoomDimensions} dimensions Room dimensions (in meters). Defaults to
 * {@linkcode Utils.DEFAULT_ROOM_DIMENSIONS DEFAULT_ROOM_DIMENSIONS}.
 * @property {Utils~RoomMaterials} materials Named acoustic materials per wall.
 * Defaults to {@linkcode Utils.DEFAULT_ROOM_MATERIALS DEFAULT_ROOM_MATERIALS}.
 * @property {Number} speedOfSound
 * (in meters/second). Defaults to
 * {@linkcode Utils.DEFAULT_SPEED_OF_SOUND DEFAULT_SPEED_OF_SOUND}.
 */


/**
 * @class ResonanceAudio
 * @description Main class for managing sources, room and listener models.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {ResonanceAudio~ResonanceAudioOptions} options
 * Options for constructing a new ResonanceAudio scene.
 */
function ResonanceAudio(context, options) {
  // Public variables.
  /**
   * Binaurally-rendered stereo (2-channel) output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} output
   * @memberof ResonanceAudio
   * @instance
   */
  /**
   * Ambisonic (multichannel) input {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}
   * (For rendering input soundfields).
   * @member {AudioNode} ambisonicInput
   * @memberof ResonanceAudio
   * @instance
   */
  /**
   * Ambisonic (multichannel) output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}
   * (For allowing external rendering / post-processing).
   * @member {AudioNode} ambisonicOutput
   * @memberof ResonanceAudio
   * @instance
   */

  // Use defaults for undefined arguments.
  if (options == undefined) {
    options = {};
  }
  if (options.ambisonicOrder == undefined) {
    options.ambisonicOrder = Utils.DEFAULT_AMBISONIC_ORDER;
  }
  if (options.listenerPosition == undefined) {
    options.listenerPosition = Utils.DEFAULT_POSITION.slice();
  }
  if (options.listenerForward == undefined) {
    options.listenerForward = Utils.DEFAULT_FORWARD.slice();
  }
  if (options.listenerUp == undefined) {
    options.listenerUp = Utils.DEFAULT_UP.slice();
  }
  if (options.dimensions == undefined) {
    options.dimensions = {};
    Object.assign(options.dimensions, Utils.DEFAULT_ROOM_DIMENSIONS);
  }
  if (options.materials == undefined) {
    options.materials = {};
    Object.assign(options.materials, Utils.DEFAULT_ROOM_MATERIALS);
  }
  if (options.speedOfSound == undefined) {
    options.speedOfSound = Utils.DEFAULT_SPEED_OF_SOUND;
  }

  // Create member submodules.
  this._ambisonicOrder = Encoder.validateAmbisonicOrder(options.ambisonicOrder);
  this._sources = [];
  this._room = new Room(context, {
    listenerPosition: options.listenerPosition,
    dimensions: options.dimensions,
    materials: options.materials,
    speedOfSound: options.speedOfSound,
  });
  this._listener = new Listener(context, {
    ambisonicOrder: options.ambisonicOrder,
    position: options.listenerPosition,
    forward: options.listenerForward,
    up: options.listenerUp,
  });

  // Create auxillary audio nodes.
  this._context = context;
  this.output = context.createGain();
  this.ambisonicOutput = context.createGain();
  this.ambisonicInput = this._listener.input;

  // Connect audio graph.
  this._room.output.connect(this._listener.input);
  this._listener.output.connect(this.output);
  this._listener.ambisonicOutput.connect(this.ambisonicOutput);
}


/**
 * Create a new source for the scene.
 * @param {Source~SourceOptions} options
 * Options for constructing a new Source.
 * @return {Source}
 */
ResonanceAudio.prototype.createSource = function(options) {
  // Create a source and push it to the internal sources array, returning
  // the object's reference to the user.
  let source = new Source(this, options);
  this._sources[this._sources.length] = source;
  return source;
};


/**
 * Set the scene's desired ambisonic order.
 * @param {Number} ambisonicOrder Desired ambisonic order.
 */
ResonanceAudio.prototype.setAmbisonicOrder = function(ambisonicOrder) {
  this._ambisonicOrder = Encoder.validateAmbisonicOrder(ambisonicOrder);
};


/**
 * Set the room's dimensions and wall materials.
 * @param {Object} dimensions Room dimensions (in meters).
 * @param {Object} materials Named acoustic materials per wall.
 */
ResonanceAudio.prototype.setRoomProperties = function(dimensions, materials) {
  this._room.setProperties(dimensions, materials);
};


/**
 * Set the listener's position (in meters), where origin is the center of
 * the room.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
ResonanceAudio.prototype.setListenerPosition = function(x, y, z) {
  // Update listener position.
  this._listener.position[0] = x;
  this._listener.position[1] = y;
  this._listener.position[2] = z;
  this._room.setListenerPosition(x, y, z);

  // Update sources with new listener position.
  this._sources.forEach(function(element) {
     element._update();
  });
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
ResonanceAudio.prototype.setListenerOrientation = function(forwardX, forwardY,
  forwardZ, upX, upY, upZ) {
  this._listener.setOrientation(forwardX, forwardY, forwardZ, upX, upY, upZ);
};


/**
 * Set the listener's position and orientation using a Three.js Matrix4 object.
 * @param {Object} matrix
 * The Three.js Matrix4 object representing the listener's world transform.
 */
ResonanceAudio.prototype.setListenerFromMatrix = function(matrix) {
  this._listener.setFromMatrix(matrix);

  // Update the rest of the scene using new listener position.
  this.setListenerPosition(this._listener.position[0],
    this._listener.position[1], this._listener.position[2]);
};


/**
 * Set the speed of sound.
 * @param {Number} speedOfSound
 */
ResonanceAudio.prototype.setSpeedOfSound = function(speedOfSound) {
  this._room.speedOfSound = speedOfSound;
};


module.exports = ResonanceAudio;
