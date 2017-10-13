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
 * @file Spatially encodes input using weighted spherical harmonics.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';

// Internal dependencies.
const Tables = require('./tables.js');
const Utils = require('./utils.js');


/**
 * @class Encoder
 * @description Spatially encodes input using weighted spherical harmonics.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Object} options
 * @param {Number} options.ambisonicOrder
 * Desired ambisonic order. Defaults to
 * {@linkcode Utils.DEFAULT_AMBISONIC_ORDER DEFAULT_AMBISONIC_ORDER}.
 * @param {Number} options.azimuth
 * Azimuth (in degrees). Defaults to
 * {@linkcode Utils.DEFAULT_AZIMUTH DEFAULT_AZIMUTH}.
 * @param {Number} options.elevation
 * Elevation (in degrees). Defaults to
 * {@linkcode Utils.DEFAULT_ELEVATION DEFAULT_ELEVATION}.
 * @param {Number} options.sourceWidth
 * Source width (in degrees). Where 0 degrees is a point source and 360 degrees
 * is an omnidirectional source. Defaults to
 * {@linkcode Utils.DEFAULT_SOURCE_WIDTH DEFAULT_SOURCE_WIDTH}.
 */
function Encoder(context, options) {
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
    options = {};
  }
  if (options.ambisonicOrder == undefined) {
    options.ambisonicOrder = Utils.DEFAULT_AMBISONIC_ORDER;
  }
  if (options.azimuth == undefined) {
    options.azimuth = Utils.DEFAULT_AZIMUTH;
  }
  if (options.elevation == undefined) {
    options.elevation = Utils.DEFAULT_ELEVATION;
  }
  if (options.sourceWidth == undefined) {
    options.sourceWidth = Utils.DEFAULT_SOURCE_WIDTH;
  }

  this._context = context;

  // Create I/O nodes.
  this.input = context.createGain();
  this._channelGain = [];
  this._merger = undefined;
  this.output = context.createGain();

  // Set initial order, angle and source width.
  this.setAmbisonicOrder(options.ambisonicOrder);
  this._azimuth = options.azimuth;
  this._elevation = options.elevation;
  this.setSourceWidth(options.sourceWidth);
}

/**
 * Set the desired ambisonic order.
 * @param {Number} ambisonicOrder Desired ambisonic order.
 */
Encoder.prototype.setAmbisonicOrder = function(ambisonicOrder) {
  this._ambisonicOrder = Encoder.validateAmbisonicOrder(ambisonicOrder);

  this.input.disconnect();
  for (let i = 0; i < this._channelGain.length; i++) {
    this._channelGain[i].disconnect();
  }
  if (this._merger != undefined) {
    this._merger.disconnect();
  }
  delete this._channelGain;
  delete this._merger;

  // Create audio graph.
  let numChannels = (this._ambisonicOrder + 1) * (this._ambisonicOrder + 1);
  this._merger = this._context.createChannelMerger(numChannels);
  this._channelGain = new Array(numChannels);
  for (let i = 0; i < numChannels; i++) {
    this._channelGain[i] = this._context.createGain();
    this.input.connect(this._channelGain[i]);
    this._channelGain[i].connect(this._merger, 0, i);
  }
  this._merger.connect(this.output);
};


/**
 * Set the direction of the encoded source signal.
 * @param {Number} azimuth
 * Azimuth (in degrees). Defaults to
 * {@linkcode Utils.DEFAULT_AZIMUTH DEFAULT_AZIMUTH}.
 * @param {Number} elevation
 * Elevation (in degrees). Defaults to
 * {@linkcode Utils.DEFAULT_ELEVATION DEFAULT_ELEVATION}.
 */
Encoder.prototype.setDirection = function(azimuth, elevation) {
  // Format input direction to nearest indices.
  if (azimuth == undefined || isNaN(azimuth)) {
    azimuth = Utils.DEFAULT_AZIMUTH;
  }
  if (elevation == undefined || isNaN(elevation)) {
    elevation = Utils.DEFAULT_ELEVATION;
  }

  // Store the formatted input (for updating source width).
  this._azimuth = azimuth;
  this._elevation = elevation;

  // Format direction for index lookups.
  azimuth = Math.round(azimuth % 360);
  if (azimuth < 0) {
    azimuth += 360;
  }
  elevation = Math.round(Math.min(90, Math.max(-90, elevation))) + 90;

  // Assign gains to each output.
  this._channelGain[0].gain.value = Tables.MAX_RE_WEIGHTS[this._spreadIndex][0];
  for (let i = 1; i <= this._ambisonicOrder; i++) {
    let degreeWeight = Tables.MAX_RE_WEIGHTS[this._spreadIndex][i];
    for (let j = -i; j <= i; j++) {
      let acnChannel = (i * i) + i + j;
      let elevationIndex = i * (i + 1) / 2 + Math.abs(j) - 1;
      let val = Tables.SPHERICAL_HARMONICS[1][elevation][elevationIndex];
      if (j != 0) {
        let azimuthIndex = Tables.SPHERICAL_HARMONICS_MAX_ORDER + j - 1;
        if (j < 0) {
          azimuthIndex = Tables.SPHERICAL_HARMONICS_MAX_ORDER + j;
        }
        val *= Tables.SPHERICAL_HARMONICS[0][azimuth][azimuthIndex];
      }
      this._channelGain[acnChannel].gain.value = val * degreeWeight;
    }
  }
};


/**
 * Set the source width (in degrees). Where 0 degrees is a point source and 360
 * degrees is an omnidirectional source.
 * @param {Number} sourceWidth (in degrees).
 */
Encoder.prototype.setSourceWidth = function(sourceWidth) {
  // The MAX_RE_WEIGHTS is a 360 x (Tables.SPHERICAL_HARMONICS_MAX_ORDER+1)
  // size table.
  this._spreadIndex = Math.min(359, Math.max(0, Math.round(sourceWidth)));
  this.setDirection(this._azimuth, this._elevation);
};


/**
 * Validate the provided ambisonic order.
 * @param {Number} ambisonicOrder Desired ambisonic order.
 * @return {Number} Validated/adjusted ambisonic order.
 * @private
 */
Encoder.validateAmbisonicOrder = function(ambisonicOrder) {
  if (isNaN(ambisonicOrder) || ambisonicOrder == undefined) {
    Utils.log('Error: Invalid ambisonic order',
    options.ambisonicOrder, '\nUsing ambisonicOrder=1 instead.');
    ambisonicOrder = 1;
  } else if (ambisonicOrder < 1) {
    Utils.log('Error: Unable to render ambisonic order',
    options.ambisonicOrder, '(Min order is 1)',
    '\nUsing min order instead.');
    ambisonicOrder = 1;
  } else if (ambisonicOrder > Tables.SPHERICAL_HARMONICS_MAX_ORDER) {
    Utils.log('Error: Unable to render ambisonic order',
    options.ambisonicOrder, '(Max order is',
    Tables.SPHERICAL_HARMONICS_MAX_ORDER, ')\nUsing max order instead.');
    options.ambisonicOrder = Tables.SPHERICAL_HARMONICS_MAX_ORDER;
  }
  return ambisonicOrder;
};


module.exports = Encoder;
