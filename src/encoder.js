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
 * @file Spatially encodes input using spherical harmonics.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';

// Internal dependencies.
var Tables = require('./tables.js');
var Utils = require('./utils.js');

/**
 * @class Encoder
 * @description Spatially encodes input using weighted spherical harmonics.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Object} options
 * @param {Number} options.ambisonicOrder
 * Desired ambisonic Order. Defaults to
 * {@link DEFAULT_AMBISONIC_ORDER DEFAULT_AMBISONIC_ORDER}.
 * @param {Number} options.azimuth
 * Azimuth (in degrees). Defaults to
 * {@link Encoder.DEFAULT_AZIMUTH DEFAULT_AZIMUTH}.
 * @param {Number} options.elevation
 * Elevation (in degrees). Defaults to
 * {@link Encoder.DEFAULT_ELEVATION DEFAULT_ELEVATION}.
 */
function Encoder (context, ambisonicOrder) {
  // Public variables.
  /**
   * Input {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} input
   * @memberof Encoder
   * @instance
   */
  /**
   * Output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} output
   * @memberof Encoder
   * @instance
   */
  this._ambisonicOrder = ambisonicOrder;
  if (this._ambisonicOrder > Encoder.MAX_ORDER) {
    Utils.log('(Error):\nUnable to render ambisonic order',
      ambisonic_order, '(Max order is', Encoder.MAX_ORDER,
      ')\nUsing max order instead.');
    this._ambisonicOrder = Encoder.MAX_ORDER;
  }

  var num_channels = (this._ambisonicOrder + 1) * (this._ambisonicOrder + 1);
  this._merger = context.createChannelMerger(num_channels);
  this._masterGain = context.createGain();
  this._channelGain = new Array(num_channels);
  for (var i = 0; i < num_channels; i++) {
    this._channelGain[i] = context.createGain();
    this._masterGain.connect(this._channelGain[i]);
    this._channelGain[i].connect(this._merger, 0, i);
  }

  // Input/Output proxy.
  this.input = this._masterGain;
  this.output = this._merger;
}

/**
 * Set the direction of the encoded source signal.
 * @param {Number} azimuth
 * Azimuth (in degrees). Defaults to
 * {@link Encoder.DEFAULT_AZIMUTH DEFAULT_AZIMUTH}.
 * @param {Number} elevation
 * Elevation (in degrees). Defaults to
 * {@link Encoder.DEFAULT_ELEVATION DEFAULT_ELEVATION}.
 */
Encoder.prototype.setDirection = function (azimuth, elevation) {
  // Format input direction to nearest indices.
  if (azimuth == undefined || isNaN(azimuth)) {
    azimuth = Encoder.DEFAULT_AZIMUTH;
  }
  if (elevation == undefined || isNaN(elevation)) {
    elevation = Encoder.DEFAULT_ELEVATION;
  }

  azimuth = Math.round(azimuth % 360);
  if (azimuth < 0) {
    azimuth += 360;
  }
  elevation = Math.round(Math.min(90, Math.max(-90, elevation))) + 90;

  // Assign gains to each output.
  for (var i = 1; i <= this._ambisonicOrder; i++) {
    for (var j = -i; j <= i; j++) {
      var acnChannel = (i * i) + i + j;
      var elevationIndex = i * (i + 1) / 2 + Math.abs(j) - 1;
      var val = Tables.SPHERICAL_HARMONICS[1][elevation][elevationIndex];
      if (j != 0) {
        var azimuthIndex = Encoder.MAX_ORDER + j - 1;
        if (j < 0) {
          azimuthIndex = Encoder.MAX_ORDER + j;
        }
        val *= Tables.SPHERICAL_HARMONICS[0][azimuth][azimuthIndex];
      }
      this._channelGain[acnChannel].gain.value = val;
    }
  }
}

//TODO(bitllama): finish spread function!!!
Encoder.prototype.setSpread = function (spread) {
  spread = Math.min(360, Math.max(0, spread));
  if (spread > Globals.MinSpreadPerAmbisonicOrder[this._ambisonicOrder]) {

  }
}

/** @type {Number} */
Encoder.DEFAULT_AZIMUTH = 0;
/** @type {Number} */
Encoder.DEFAULT_ELEVATION = 0;
/** @type {Number} */
Encoder.MAX_ORDER = Tables.SPHERICAL_HARMONICS[0][0].length / 2;

module.exports = Encoder;