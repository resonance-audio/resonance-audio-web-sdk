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
 * @file Spatially encodes input using weighted spherical harmonics.
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
 * {@linkcode Encoder.DEFAULT_AMBISONIC_ORDER DEFAULT_AMBISONIC_ORDER}.
 * @param {Number} options.azimuth
 * Azimuth (in degrees). Defaults to
 * {@linkcode Encoder.DEFAULT_AZIMUTH DEFAULT_AZIMUTH}.
 * @param {Number} options.elevation
 * Elevation (in degrees). Defaults to
 * {@linkcode Encoder.DEFAULT_ELEVATION DEFAULT_ELEVATION}.
 * @param {Number} options.sourceWidth
 * Source width (in degrees). Where 0 degrees is a point source and 360 degrees
 * is an omnidirectional source. Defaults to
 * {@linkcode Encoder.DEFAULT_SOURCE_WIDTH DEFAULT_SOURCE_WIDTH}.
 */
function Encoder (context, options) {
  // Public variables.
  /**
   * Mono (1-channel) input {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} input
   * @memberof Encoder
   * @instance
   */
  /**
   * Ambisonic (multichannel) output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} output
   * @memberof Encoder
   * @instance
   */

  // Use defaults for undefined arguments.
  if (options == undefined) {
    options = new Object();
  }
  if (options.ambisonicOrder == undefined) {
    options.ambisonicOrder = Encoder.DEFAULT_AMBISONIC_ORDER;
  }
  if (options.azimuth == undefined) {
    options.azimuth = Encoder.DEFAULT_AZIMUTH;
  }
  if (options.elevation == undefined) {
    options.elevation = Encoder.DEFAULT_ELEVATION;
  }
  if (options.sourceWidth == undefined) {
    options.sourceWidth = Encoder.DEFAULT_SOURCE_WIDTH;
  }

  // Assign fixed ambisonic order.
  // TODO(bitllama): Support dynamic orders?
  if (options.ambisonicOrder > Encoder.MAX_ORDER) {
    Utils.log('(Error):\nUnable to render ambisonic order',
      options.ambisonicOrder, '(Max order is', Encoder.MAX_ORDER,
      ')\nUsing max order instead.');
    options.ambisonicOrder = Encoder.MAX_ORDER;
  }
  this._ambisonicOrder = options.ambisonicOrder;

  // Create audio graph.
  var num_channels = (this._ambisonicOrder + 1) * (this._ambisonicOrder + 1);
  this._merger = context.createChannelMerger(num_channels);
  this._masterGain = context.createGain();
  this._channelGain = new Array(num_channels);
  for (var i = 0; i < num_channels; i++) {
    this._channelGain[i] = context.createGain();
    this._masterGain.connect(this._channelGain[i]);
    this._channelGain[i].connect(this._merger, 0, i);
  }

  // Set initial angle and source width.
  this._azimuth = options.azimuth;
  this._elevation = options.elevation;
  this.setSourceWidth(options.sourceWidth);

  // Input/Output proxy.
  this.input = this._masterGain;
  this.output = this._merger;
}

/**
 * Set the direction of the encoded source signal.
 * @param {Number} azimuth
 * Azimuth (in degrees). Defaults to
 * {@linkcode Encoder.DEFAULT_AZIMUTH DEFAULT_AZIMUTH}.
 * @param {Number} elevation
 * Elevation (in degrees). Defaults to
 * {@linkcode Encoder.DEFAULT_ELEVATION DEFAULT_ELEVATION}.
 */
Encoder.prototype.setDirection = function (azimuth, elevation) {
  // Format input direction to nearest indices.
  if (azimuth == undefined || isNaN(azimuth)) {
    azimuth = Encoder.DEFAULT_AZIMUTH;
  }
  if (elevation == undefined || isNaN(elevation)) {
    elevation = Encoder.DEFAULT_ELEVATION;
  }

  // Store the formatted input (for updating source width).
  this._azimuth = azimuth;
  this._elevation = elevation;

  // Format direction for index lookups.
  var azimuth = Math.round(azimuth % 360);
  if (azimuth < 0) {
    azimuth += 360;
  }
  elevation = Math.round(Math.min(90, Math.max(-90, elevation))) + 90;

  // Assign gains to each output.
  for (var i = 1; i <= this._ambisonicOrder; i++) {
    var degreeWeight = Tables.MAX_RE_WEIGHTS[this._spreadIndex][i - 1];
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
      this._channelGain[acnChannel].gain.value = val * degreeWeight;
    }
  }
}

/**
 * Set the source width (in degrees). Where 0 degrees is a point source and 360
 * degrees is an omnidirectional source. Defaults to
 * {@linkcode Encoder.DEFAULT_SOURCE_WIDTH DEFAULT_SOURCE_WIDTH}.
 * @param {Number} sourceWidth (in degrees).
 */
Encoder.prototype.setSourceWidth = function (sourceWidth) {
  // The MAX_RE_WEIGHTS is a 360x(MAX_ORDER+1) size table.
  this._spreadIndex = Math.min(359, Math.max(0, Math.round(sourceWidth)));
  this.setDirection(this._azimuth, this._elevation);
}

// Static constants.
/**
 * Default azimuth (in degrees). Suitable range is 0 to 360.
 * @type {Number}
 */
Encoder.DEFAULT_AZIMUTH = 0;
/**
 * Default elevation (in degres).
 * Suitable range is from -90 (below) to 90 (above).
 * @type {Number}
 */
Encoder.DEFAULT_ELEVATION = 0;
/**
 * The maximum allowed ambisonic order, specified by the
 * {@linkcode Tables.SPHERICAL_HARMONICS spherical harmonics table}.
 * @type {Number}
 */
Encoder.MAX_ORDER = Tables.SPHERICAL_HARMONICS[0][0].length / 2;
/**
 * The default ambisonic order.
 * @type {Number}
 */
Encoder.DEFAULT_AMBISONIC_ORDER = 1;
/**
 * The default source width.
 * @type {Number}
 */
Encoder.DEFAULT_SOURCE_WIDTH = 0;

module.exports = Encoder;