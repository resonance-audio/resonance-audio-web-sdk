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
 * @file Late reverberation filter for Ambisonic content.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';

// Internal dependencies.
var Utils = require('./utils.js');


// Static constants.
/** The default bandwidth (in octaves) of the center frequencies.
 * @type {Number}
 */
LateReflections.DEFAULT_BANDWIDTH = 1;


/** The default multiplier applied when computing tail lengths.
 * @type {Number}
 */
LateReflections.DURATION_MULTIPLIER = 1;


/**
 * The late reflections pre-delay (in milliseconds).
 * @type {Number}
 */
LateReflections.DEFAULT_PREDELAY = 1.5;


/**
 * The length of the beginning of the impulse response to apply a
 * half-Hann window to.
 * @type {Number}
 */
LateReflections.DEFAULT_TAIL_ONSET = 3.8;


/**
 * The default gain (linear).
 * @type {Number}
 */
LateReflections.DEFAULT_GAIN = 0.01;


/**
 * The maximum impulse response length (in seconds).
 * @type {Number}
 */
LateReflections.MAX_DURATION = 3;


/**
 * Center frequencies of the multiband late reflections.
 * Nine bands are computed by: 31.25 * 2^(0:8).
 * @type {Array}
 */
LateReflections.FREQUENCY_BANDS = [
  31.25, 62.5, 125, 250, 500, 1000, 2000, 4000, 8000
];


/**
 * The number of frequency bands.
 */
LateReflections.NUMBER_FREQUENCY_BANDS =
  LateReflections.FREQUENCY_BANDS.length;


/**
 * The default multiband RT60 durations (in seconds).
 * @type {Float32Array}
 */
LateReflections.DEFAULT_DURATIONS =
  new Float32Array(LateReflections.NUMBER_FREQUENCY_BANDS);


/**
 * @class LateReflections
 * @description Late-reflections reverberation filter for Ambisonic content.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Object} options
 * @param {Array} options.durations
 * Multiband RT60 durations (in seconds) for each frequency band, listed as
 * {@linkcode LateReflections.FREQUENCY_BANDS FREQUENCY_BANDS}. Defaults to
 * {@linkcode LateReflections.DEFAULT_DURATIONS DEFAULT_DURATIONS}.
 * @param {Number} options.predelay Pre-delay (in milliseconds). Defaults to
 * {@linkcode LateReflections.DEFAULT_PREDELAY DEFAULT_PREDELAY}.
 * @param {Number} options.gain Output gain (linear). Defaults to
 * {@linkcode LateReflections.DEFAULT_GAIN DEFAULT_GAIN}.
 * @param {Number} options.bandwidth Bandwidth (in octaves) for each frequency
 * band. Defaults to
 * {@linkcode LateReflections.DEFAULT_BANDWIDTH DEFAULT_BANDWIDTH}.
 * @param {Number} options.tailonset Length (in milliseconds) of impulse
 * response to apply a half-Hann window. Defaults to
 * {@linkcode LateReflections.DEFAULT_TAIL_ONSET DEFAULT_TAIL_ONSET}.
 */
function LateReflections (context, options) {
  // Public variables.
  /**
   * Mono (1-channel) input {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} input
   * @memberof LateReflections
   * @instance
   */
  /**
   * Mono (1-channel) output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} output
   * @memberof LateReflections
   * @instance
   */

  // Use defaults for undefined arguments.
  if (options == undefined) {
    options = new Object();
  }
  if (options.durations == undefined) {
    options.durations = LateReflections.DEFAULT_DURATIONS.slice();
  }
  if (options.predelay == undefined) {
    options.predelay = LateReflections.DEFAULT_PREDELAY;
  }
  if (options.gain == undefined) {
    options.gain = LateReflections.DEFAULT_GAIN;
  }
  if (options.bandwidth == undefined) {
    options.bandwidth = LateReflections.DEFAULT_BANDWIDTH;
  }
  if (options.tailonset == undefined) {
    options.tailonset = LateReflections.DEFAULT_TAIL_ONSET;
  }

  // Assign pre-computed variables.
  var delaySecs = options.predelay / 1000;
  this._bandwidthCoeff = options.bandwidth * Utils.LOG2_DIV2;
  this._tailonsetSamples = options.tailonset / 1000;

  // Create nodes.
  this._context = context;
  this.input = context.createGain();
  this._predelay = context.createDelay(delaySecs);
  this._convolver = context.createConvolver();
  this.output = context.createGain();

  // Set reverb attenuation.
  this.output.gain.value = options.gain;

  // Disable normalization.
  this._convolver.normalize = false;

  // Connect nodes.
  this.input.connect(this._predelay);
  this._predelay.connect(this._convolver);
  this._convolver.connect(this.output);

  // Compute IR using RT60 values.
  this.setDurations(options.durations);
}


/**
 * Re-compute a new impulse response by providing Multiband RT60 durations.
 * @param {Array} durations
 * Multiband RT60 durations (in seconds) for each frequency band, listed as
 * {@linkcode LateReflections.FREQUENCY_BANDS FREQUENCY_BANDS}.
 */
LateReflections.prototype.setDurations = function (durations) {
  if (durations.length !== LateReflections.NUMBER_FREQUENCY_BANDS) {
    Utils.log("Warning: invalid number of RT60 values provided to reverb.");
    return;
  }

  // Compute impulse response.
  var durationsSamples =
    new Float32Array(LateReflections.NUMBER_FREQUENCY_BANDS);
  var sampleRate = this._context.sampleRate;

  for (var i = 0; i < durations.length; i++) {
    // Clamp within suitable range.
    durations[i] =
      Math.max(0, Math.min(LateReflections.MAX_DURATION, durations[i]));

    // Convert seconds to samples.
    durationsSamples[i] = Math.round(durations[i] * sampleRate *
      LateReflections.DURATION_MULTIPLIER);
  };

  // Determine max RT60 length in samples.
  var durationsSamplesMax = 0;
  for (var i = 0; i < durationsSamples.length; i++) {
    if (durationsSamples[i] > durationsSamplesMax) {
      durationsSamplesMax = durationsSamples[i];
    }
  }

  // Skip this step if there is no reverberation to compute.
  if (durationsSamplesMax < 1) {
    durationsSamplesMax = 1;
  }

  // Create impulse response buffer.
  var buffer = this._context.createBuffer(1, durationsSamplesMax, sampleRate);
  var bufferData = buffer.getChannelData(0);

  // Create noise signal (computed once, referenced in each band's routine).
  var noiseSignal = new Float32Array(durationsSamplesMax);
  for (var i = 0; i < durationsSamplesMax; i++) {
    noiseSignal[i] = Math.random() * 2 - 1;
  }

  // Compute the decay rate per-band and filter the decaying noise signal.
  for (var i = 0; i < LateReflections.NUMBER_FREQUENCY_BANDS; i++) {
  //for (var i = 0; i < 1; i++) {
    // Compute decay rate.
    var decayRate = -Utils.LOG1000 / durationsSamples[i];

    // Construct a standard one-zero, two-pole bandpass filter:
    // H(z) = (b0 * z^0 + b1 * z^-1 + b2 * z^-2) / (1 + a1 * z^-1 + a2 * z^-2)
    var omega = Utils.TWO_PI * LateReflections.FREQUENCY_BANDS[i] / sampleRate;
    var sinOmega = Math.sin(omega);
    var alpha = sinOmega * Math.sinh(this._bandwidthCoeff * omega / sinOmega);
    var a0CoeffReciprocal = 1 / (1 + alpha);
    var b0Coeff = alpha * a0CoeffReciprocal;
    var a1Coeff = -2 * Math.cos(omega) * a0CoeffReciprocal;
    var a2Coeff = (1 - alpha) * a0CoeffReciprocal;

    // We optimize since b2 = -b0, b1 = 0.
    // Update equation for two-pole bandpass filter:
    //   u[n] = x[n] - a1 * x[n-1] - a2 * x[n-2]
    //   y[n] = b0 * (u[n] - u[n-2])
    var um1 = 0;
    var um2 = 0;
    for (var j = 0; j < durationsSamples[i]; j++) {
      // Exponentially-decaying white noise.
      var x = noiseSignal[j] * Math.exp(decayRate * j);

      // Filter signal with bandpass filter and add to output.
      var u = x - a1Coeff * um1 - a2Coeff * um2;
      bufferData[j] += b0Coeff * (u - um2);

      // Update coefficients.
      um2 = um1;
      um1 = u;
    }
  }

  // Create and apply half of a Hann window to the beginning of the
  // impulse response.
  var halfHannLength =
    Math.round(this._tailonsetSamples);
  for (var i = 0; i < Math.min(bufferData.length, halfHannLength); i++) {
    var halfHann =
      0.5 * (1 - Math.cos(Utils.TWO_PI * i / (2 * halfHannLength - 1)));
      bufferData[i] *= halfHann;
  }
  this._convolver.buffer = buffer;
}


module.exports = LateReflections;
