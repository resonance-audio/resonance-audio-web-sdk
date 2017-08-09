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
var Omnitone = require('./omnitone.js');
var Utils = require('./utils.js');

/**
 * @class Listener
 * @description Listener model to spatialize sources in an environment.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Number} options.ambisonicOrder
 * Desired ambisonic order. Defaults to
 * {@linkcode Encoder.DEFAULT_AMBISONIC_ORDER DEFAULT_AMBISONIC_ORDER}.
 * @param {Float32Array} options.position
 * Initial position (in meters), where origin is the center of
 * the room. Defaults to
 * {@linkcode DEFAULT_POSITION DEFAULT_POSITION}.
 * @param {Float32Array} options.orientation
 * Orientation (roll, pitch and yaw, in radians). Defaults to
 * {@linkcode DEFAULT_ORIENTATION DEFAULT_ORIENTATION}.
 */
function Listener (context, options) {
  // Public variables.
  /**
   * Position (in meters).
   * @member {Float32Array} position
   * @memberof Listener
   * @instance
   */
  /**
   * Ambisonic (multichannel) input {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} input
   * @memberof Listener
   * @instance
   */
  /**
   * Binaurally-rendered stereo (2-channel) output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} output
   * @memberof Listener
   * @instance
   */
  /**
   * Ambisonic (multichannel) output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} ambisonicOutput
   * @memberof Listener
   * @instance
   */
  // Use defaults for undefined arguments.
  if (options == undefined) {
    options = new Object();
  }
  if (options.ambisonicOrder == undefined) {
    options.ambisonicOrder = Encoder.DEFAULT_AMBISONIC_ORDER;
  }
  if (options.position == undefined) {
    options.position = Globals.DEFAULT_POSITION;
  }
  if (options.orientation == undefined) {
    options.orientation = Globals.DEFAULT_ORIENTATION;
  }

  // Member variables.
  this.position = new Float32Array(3);

  // Select the appropriate HRIR filters using 8-channel chunks since
  // >8 channels is not yet supported by a majority of browsers.
  // TODO(bitllama): Place these HRIR filters online somewhere?
  var urls = [''];
  if (options.ambisonicOrder == 1) {
    urls = [
      'resources/sh_hrir_o_1.wav'
    ];
  }
  else if (options.ambisonicOrder == 2) {
    urls = [
      'resources/sh_hrir_o_2_ch0-ch7.wav',
      'resources/sh_hrir_o_2_ch8.wav'
    ];
  }
  else if (options.ambisonicOrder == 3) {
    urls = [
      'resources/sh_hrir_o_3_ch0-ch7.wav',
      'resources/sh_hrir_o_3_ch8-ch15.wav'
    ];
  }
  else {
    // TODO(bitllama): Throw an error?!
  }

  // Create audio nodes.
  this._context = context;
  this._renderer = Omnitone.Omnitone.createHOARenderer(context, {
    ambisonicOrder: options.ambisonicOrder,
    HRIRUrl: urls
  });

  // These nodes are created in order to safely asynchronously load Omnitone
  // while the rest of Songbird is being created.
  this.input = context.createGain();
  this.ambisonicOutput = context.createGain();
  this.output = context.createGain();

  // Initialize Omnitone (async) and connect to audio graph when complete.
  var that = this;
  this._renderer.initialize().then(function () {
    // Connect pre-rotated soundfield to renderer.
    that.input.connect(that._renderer.input);

    // Connect rotated soundfield to ambisonic output.
    that._renderer._hoaRotator.output.connect(that.ambisonicOutput);

    // Connect binaurally-rendered soundfield to binaural output.
    that._renderer.output.connect(that.output);
  });
}

/**
 * Set the listener's orientation (in radians).
 * @param {Number} roll
 * @param {Number} pitch
 * @param {Number} yaw
 */
Listener.prototype.setOrientation = function (roll, pitch, yaw) {
  var q = Utils.toQuaternion(roll, pitch, yaw);
  var right = Utils.rotateVector(Globals.DEFAULT_RIGHT, q);
  var up = Utils.rotateVector(Globals.DEFAULT_UP, q);
  var forward = Utils.rotateVector(Globals.DEFAULT_FORWARD, q);
  var matrix = new Float32Array(9);
  matrix[0] = right[0];
  matrix[1] = right[1];
  matrix[2] = right[2];
  matrix[3] = up[0];
  matrix[4] = up[1];
  matrix[5] = up[2];
  matrix[6] = forward[0];
  matrix[7] = forward[1];
  matrix[8] = forward[2];
  this._renderer.setRotationMatrix(matrix);
}

/**
 * Set the listener's orientation using a Three.js camera object.
 * @param {Object} cameraMatrix
 * The Matrix4 object of the Three.js camera.
 */
Listener.prototype.setOrientationFromCamera = function (cameraMatrix) {
  this._renderer.setRotationMatrixFromCamera(cameraMatrix);
}

module.exports = Listener;