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
 * @file Listener model to spatialize sources in an environment.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';

// Internal dependencies.
var Reflections = require('./reflections.js');
var Reverb = require('./reverb.js');
var Room = require('./room.js');
var Globals = require('./globals.js');
var Utils = require('./utils.js');

/**
 * @class Listener
 * @description Listener model to spatialize sources in an environment.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Number} options.ambisonicOrder
 * Desired ambisonic order.
 * @param {Map} options.dimensions
 * Dimensions map which should conform to the layout of
 * {@link Room.DefaultDimensions Room.DefaultDimensions}
 * @param {Map} options.materials
 * Materials map which should conform to the layout of
 * {@link Room.DefaultMaterials Room.DefaultMaterials}
 * @param {Number} options.speedOfSound
 * (in meters / second).
 */
function Listener (context, options) {
  // Public variables.
  /**
   * Listener's speed of sound (in meters/second).
   * @member {Number} speedOfSound
   * @memberof Listener
   */
  /**
   * Input to .connect() input AudioNodes to.
   * @member {AudioNode} input
   * @memberof Reverb
   */
  /**
   * Outuput to .connect() object from.
   * @member {AudioNode} output
   * @memberof Listener
   */

  //TODO(bitllama): Add "outside-the-room" effect.

  // Assign defaults for undefined options.
  if (options == undefined) {
    options = new Object();
  }
  if (options.ambisonicOrder == undefined) {
    options.ambisonicOrder = Globals.DefaultAmbisonicOrder;
  }
  if (options.speedOfSound == undefined) {
    options.speedOfSound = Globals.DefaultSpeedOfSound;
  }
  this.speedOfSound = Globals.DefaultSpeedOfSound;

  // Stored in order to access when constructing sources.
  this._context = context;
  this._ambisonicOrder = options.ambisonicOrder;
  this._position = new Float32Array(3);
  this._velocity = new Float32Array(3);
  this._forward = new Float32Array(3);
  this._up = new Float32Array(3);
  this._right = new Float32Array(3);

  // Create nodes.
  this._reflections = new Reflections(context, options);
  this._reverb = new Reverb(context);
  this.output = context.createGain();

  // Connect nodes.
  this._reflections.output.connect(this.output);
  this._reverb.output.connect(this.output);

  // Assign initial conditions.
  this.setPosition(0, 0, 0);
  this.setVelocity(0, 0, 0);
  this.setOrientation(0, 0, 0);
  this.setRoomProperties(options.dimensions, options.materials);
}

/**
 * Set the listener's position (in meters).
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Listener.prototype.setPosition = function(x, y, z) {
  this._position = [x, y, z];
  this._reflections.speedOfSound = this.speedOfSound;
  this._reflections.setListenerPosition(x, y, z);
}

/**
 * Set the listener's velocity (in meters/second).
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Listener.prototype.setVelocity = function(x, y, z) {
  //TODO(bitllama): Doppler!
}

/**
 * Set the listener's orientation (in radians).
 * @param {Number} roll
 * @param {Number} pitch
 * @param {Number} yaw
 */
Listener.prototype.setOrientation = function(roll, pitch, yaw) {
  var q = Utils.toQuaternion(roll, pitch, yaw);
  this._forward = Utils.rotateVector(Globals.DefaultForward, q);
  this._up = Utils.rotateVector(Globals.DefaultUp, q);
  this._right = Utils.rotateVector(Globals.DefaultRight, q);
}

/**
 * Set the dimensions and material properties
 * for the room associated with the listener.
 * @param {Map} dimensions
 * Dimensions map which should conform to the layout of
 * {@link Room.DefaultDimensions Room.DefaultDimensions}
 * @param {Map} materials
 * Materials map which should conform to the layout of
 * {@link Room.DefaultMaterials Room.DefaultMaterials}
 */
Listener.prototype.setRoomProperties = function(dimensions, materials) {
  // Update reverb.
  var coefficients = Room.getCoefficientsFromMaterials(materials);
  var RT60Secs =
    Room.computeRT60Secs(dimensions, coefficients, this.speedOfSound);
  this._reverb.setRT60s(RT60Secs);

  // Update reflections.
  this._reflections.speedOfSound = this.speedOfSound;
  this._reflections.setRoomProperties(dimensions, coefficients);
}

module.exports = Listener;