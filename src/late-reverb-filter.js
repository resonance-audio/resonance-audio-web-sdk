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
 * @fileOverview Late Reverberation Filter for ambisonic content.
 */

'use strict';

var MAX_T60 = 3;

/**
 * @class LateReverbFilter
 * @description Late Reverberation Filter for ambisonic content.
 * @param {AudioContext} context            Associated AudioContext.
 * @param {Object} options
 * @param {Number} options.speedOfSound     Speed of Sound (in meters / second).
 * @param {Array} options.roomDimensions    Size dimensions in meters (w, h, d).
 * @param {Array} options.roomMaterials     Absorption coeffs (L,R,U,D,F,B).
 */
function LateReverbFilter (context, options) {
  var t60, k, V, A;
  var decayRate = 0;
  var recipSampleRate = 1 / context.sampleRate;

  this._context = context;

  // Acoustic constant.
  if (options.speedOfSound > 0) {
    k = 55.262042231857102 / options.speedOfSound;
  } else {
    k = 0.161113825748855;
  }

  // Room volume.
  V = options.roomDimensions[0] * options.roomDimensions[1] * options.roomDimensions[2];

  var xy = options.roomDimensions[0] * options.roomDimensions[1];
  var xz = options.roomDimensions[0] * options.roomDimensions[2];
  var yz = options.roomDimensions[1] * options.roomDimensions[2];

  // Effective absorptive area.
  A = (options.roomMaterials[0] + options.roomMaterials[1]) * xy +
      (options.roomMaterials[0] + options.roomMaterials[2]) * xz +
      (options.roomMaterials[1] + options.roomMaterials[2]) * yz;

  // Reverberation time.
  t60 = Math.min(Math.max(0, (A > 1e-4 ? k * V / A : 0)), MAX_T60);

  // Over-sample beyond T60 to ensure no artificial dropout.
  var t60_samples = Math.round(t60 * this._context.sampleRate * 1.25);
  if (t60_samples < 1) {
    t60_samples = 1;
  }
  this._buffer =
    this._context.createBuffer(1, t60_samples, this._context.sampleRate);

  // Compute IR (single-band T60 for now).
  if (this.T60 > 0) {
    decayRate = -6.907755278982137 / this.T60;
  }
  var bufferData = this._buffer.getChannelData(0);
  for (var i = 0; i < t60_samples; i++) {
    bufferData[i] = (Math.random()* 2 - 1) *
      Math.exp(decayRate * i * recipSampleRate);
  }

  // Create ConvolverNode.
  this._convolver = context.createConvolver();
  this._convolver.buffer = this._buffer;

  // Input/Output proxy.
  this.input = this._convolver;
  this.output = this._convolver;
}

module.exports = LateReverbFilter;