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
 * Desired ambisonic order. Defaults to
 * {@link DEFAULT_AMBISONIC_ORDER DEFAULT_AMBISONIC_ORDER}.
 * @param {Map} options.dimensions
 * Dimensions map which should conform to the layout of
 * {@link Room.DefaultDimensions Room.DefaultDimensions}
 * @param {Map} options.materials
 * Materials map which should conform to the layout of
 * {@link Room.DefaultMaterials Room.DefaultMaterials}
 * @param {Number} options.speedOfSound
 * (in meters / second). Defaults to
 * {@link SPEED_OF_SOUND SPEED_OF_SOUND}.
 * @param {Float32Array} options.position
 * Position [x,y,z] from the center of the room (in meters). Defaults to
 * {@link DEFAULT_POSITION DEFAULT_POSITION}.
 * @param {Float32Array} options.orientation
 * Orientation [roll, pitch, yaw] (in radians). Defaults to
 * {@link DEFAULT_ORIENTATION DEFAULT_ORIENTATION}.
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

  // Assign defaults for undefined options.
  if (options == undefined) {
    options = new Object();
  }
  if (options.ambisonicOrder == undefined) {
    options.ambisonicOrder = Globals.DEFAULT_AMBISONIC_ORDER;
  }
  if (options.speedOfSound == undefined) {
    options.speedOfSound = Globals.SPEED_OF_SOUND;
  }
  if (options.position == undefined) {
    options.position = Globals.DEFAULT_POSITION;
  }
  if (options.orientation == undefined) {
    options.orientation = Globals.DEFAULT_ORIENTATION;
  }

  this.speedOfSound = options.speedOfSound;

  // Stored in order to access when constructing sources.
  this._context = context;
  this._ambisonicOrder = options.ambisonicOrder;
  this._position = new Float32Array(3);
  this._forward = new Float32Array(3);
  this._up = new Float32Array(3);
  this._right = new Float32Array(3);

  // Create nodes.
  this._reflections = new Reflections(context, options);
  this._reverb = new Reverb(context);
  this._roomGain = context.createGain();
  this.output = context.createGain();

  // Connect nodes.
  //this._reflections.output.connect(this._roomGain);
  this._reverb.output.connect(this._roomGain);
  this._roomGain.connect(this.output);

  // Assign initial conditions.
  this.setPosition(options.position[0], options.position[1],
    options.position[2]);
  this.setOrientation(options.orientation[0], options.orientation[1],
    options.orientation[2]);
  this.setRoomProperties(options.dimensions, options.materials);
}

/**
 * Set the listener's position (in meters).
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Listener.prototype.setPosition = function (x, y, z) {
  this._position = [x, y, z];
  this._reflections.speedOfSound = this.speedOfSound;
  this._reflections.setListenerPosition(x, y, z);

  // Determine if listener is outside room dimensions.
  // If so, disable room effects.
  if (Math.abs(this._position[0]) > this._reflections._halfDimensions['width']
    || Math.abs(this._position[1]) > this._reflections._halfDimensions['height']
    || Math.abs(this._position[2]) > this._reflections._halfDimensions['depth']
  ) {
    this._roomGain.gain.value = 0;
  } else {
    this._roomGain.gain.value = 1;
  }
}

/**
 * Set the listener's orientation (in radians).
 * @param {Number} roll
 * @param {Number} pitch
 * @param {Number} yaw
 */
Listener.prototype.setOrientation = function (roll, pitch, yaw) {
  var q = Utils.toQuaternion(roll, pitch, yaw);
  this._forward = Utils.rotateVector(Globals.DEFAULT_FORWARD, q);
  this._up = Utils.rotateVector(Globals.DEFAULT_UP, q);
  this._right = Utils.rotateVector(Globals.DEFAULT_RIGHT, q);
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
Listener.prototype.setRoomProperties = function (dimensions, materials) {
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