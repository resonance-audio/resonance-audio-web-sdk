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
//var AmbisonicEncoder = require('./ambisonic-encoder.js');
//var Attenuation = require('./attenuation.js');
//var Listener = require('./listener.js');
var Source = require('./source.js');
var Room = require('./room.js');
var LateReflections = require('./late-reflections.js');
var EarlyReflections = require('./early-reflections.js');
var Global = require('./global.js');

/**
 * @class Songbird spatial audio.
 * @description Main class for managing sources, room and listener models.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Object} options
 * @param {Number} ambisonicOrder
 * @param {Float32Array} listenerPosition
 */
function Songbird (context, options) {
  this._context = context;
  if (options == undefined) {
    options = new Object();
  }
  if (options.ambisonicOrder == undefined) {
    options.ambisonicOrder = Global.DEFAULT_AMBISONIC_ORDER;
  }
  this._ambisonicOrder = options.ambisonicOrder;

  // Member submodules.
  this._sources = [];
  this._room = new Room(context);

  // Member variables.
  this._position = new Float32Array(3);

  // Create auxillary audio nodes.
  this.output = context.createGain();

  // Connect audio graph.
  this._room.output.connect(this.output);
}

Songbird.prototype.createSource = function (audioNode, options) {
  this._sources.push(new Source(this, options));
  audioNode.connect(this._sources[this._sources.length - 1].input);
  return this._sources[this._sources.length - 1];
}

Songbird.prototype.removeSource = function (source) {
  var index = this._sources.indexOf(source);
  if (index > -1) {
    this._sources.splice(index, 1);
  } else {
    Utils.log("Error: Source not found, not removed!");
  }
}

Songbird.prototype.setRoomProperties = function (dimensions, materials) {
  this._room.setProperties(dimensions, materials);
}

Songbird.prototype.setListenerPosition = function (x, y, z) {
  this._position[0] = x;
  this._position[1] = y;
  this._position[2] = z;
  this._room.setListenerPosition(x, y, z);
  for (var i = 0; i < this._sources.length; i++) {
    this._sources[i].setPosition(this._sources[i]._position[0],
      this._sources[i]._position[1], this._sources[i]._position[2]);
  }
}

Songbird.prototype.setListenerOrientation = function (roll, pitch, yaw) {
  //TODO(bitllama): Omnitone stuff here...
}

Songbird.createRoom = function (context, options) {
  return new Room(context, options);
}
Songbird.createLateReflections = function (context, options) {
  return new LateReflections(context, options);
}
Songbird.createEarlyReflections = function (context, options) {
  return new EarlyReflections(context, options);
}

// var Songbird = {};

// /**
//  * Create {@link Listener Listener} to listen to
//  * sources in a configurable environment.
//  * @param {AudioContext} context
//  * Associated {@link
// https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
//  * @param {Number} options.ambisonicOrder
//  * Desired ambisonic order.
//  * @param {Map} options.dimensions
//  * Dimensions map which should conform to the layout of
//  * {@link Room.DefaultDimensions Room.DefaultDimensions}
//  * @param {Map} options.materials
//  * Materials map which should conform to the layout of
//  * {@link Room.DefaultMaterials Room.DefaultMaterials}
//  * @param {Number} options.speedOfSound
//  * (in meters / second).
//  * @returns {Listener}
//  */
// Songbird.createListener = function (context, options) {
//   return new Listener(context, options);
// }

// /**
//  * Create {@link Source Source} to spatialize an audio buffer.
//  * @param {Listener} listener Associated Listener.
//  * @param {Object} options
//  * @param {Number} options.minDistance Min. distance (in meters).
//  * @param {Number} options.maxDistance Max. distance (in meters).
//  * @param {Number} options.gain Gain (linear).
//  * @param {Float32Array} options.position Position [x,y,z] (in meters).
//  * @param {Float32Array} options.velocity Velocity [x,y,z] (in meters).
//  * @param {Float32Array} options.orientation Orientation [x,y,z] (in meters).
//  * @returns {Source}
//  */
// Songbird.createSource = function (listener, options) {
//   return new Source(listener, options);
// }

// /**
//  * Create {@link Encoder Encoder} to spatially encodes input
//  * using spherical harmonics.
//  * @param {AudioContext} context
//  * Associated {@link
// https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
//  * @param {Number} ambisonicOrder
//  * Desired ambisonic Order. Defaults to
//  * {@link Globals.DEFAULT_AMBISONIC_ORDER Globals.DEFAULT_AMBISONIC_ORDER}.
//  * @returns {Encoder}
//  */
// Songbird.createEncoder = function (context, ambisonicOrder) {
//   return new Encoder(context, ambisonicOrder);
// }

// /**
//  * Create {@link Attenuation Attenuation} to apply distance attenuation.
//  * @param {AudioContext} context
//  * Associated {@link
// https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
//  * @param {Object} options
//  * @param {Number} options.minDistance Min. distance (in meters).
//  * @param {Number} options.maxDistance Max. distance (in meters).
//  * @param {string} options.rolloffModel
//  * Rolloff model to use, chosen from options in
//  * {@link Globals.ROLLOFF_MODELS Globals.ROLLOFF_MODELS}.
//  * @return {Attenuation}
//  */
// Songbird.createAttenuation = function (context, options) {
//   return new Attenuation(context, options);
// }

module.exports = Songbird;