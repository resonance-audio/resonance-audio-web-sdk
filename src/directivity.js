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
 * @file Directivity/occlusion filter.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';

// Internal dependencies.
var Utils = require('./utils.js');

/**
 * @class Directivity
 * @description Directivity/occlusion filter.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Object} options
 * @param {Number} options.alpha
 * Determines directivity pattern (0 to 1). See
 * {@link Directivity#setPattern setPattern} for more details. Defaults to
 * {@linkcode Directivity.DEFAULT_ALPHA DEFAULT_ALPHA}.
 * @param {Number} options.exponent
 * Determines the steepness of the directivity pattern (1 to Inf). See
 * {@link Directivity#setPattern setPattern} for more details. Defaults to
 * {@linkcode Directivity.DEFAULT_EXPONENT DEFAULT_EXPONENT}.
 */
function Directivity (context, options) {
  // Public variables.
  /**
   * Mono (1-channel) input {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} input
   * @memberof Directivity
   * @instance
   */
  /**
   * Mono (1-channel) output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} output
   * @memberof Directivity
   * @instance
   */

  // Use defaults for undefined arguments.
  if (options == undefined) {
    options = new Object();
  }
  if (options.alpha == undefined) {
    options.alpha = Directivity.DEFAULT_ALPHA;
  }
  if (options.exponent == undefined) {
    options.exponent = Directivity.DEFAULT_EXPONENT;
  }

  // Create audio node.
  this._context = context;
  this._lowpass = context.createBiquadFilter();

  // Initialize filter coefficients.
  this._lowpass.type = 'lowpass';
  this._lowpass.Q.value = 0;
  this._lowpass.frequency.value = context.sampleRate * 0.5;

  this._cosTheta = 0;
  this.setPattern(options.alpha, options.exponent);

  // Input/Output proxy.
  this.input = this._lowpass;
  this.output = this._lowpass;
}

/**
 * Compute the filter using the source's forward orientation and the listener's
 * position.
 * @param {Float32Array} forward The source's forward vector (normalized).
 * @param {Float32Array} direction The direction from the source to the
 * listener (normalized).
 */
Directivity.prototype.computeAngle = function (forward, direction) {
  var coeff = 1;
  if (this._alpha > Utils.EPSILON_FLOAT) {
    var cosTheta = forward[0] * direction[0] + forward[1] * direction[1] +
      forward[2] * direction[2];
    coeff = (1 - this._alpha) + this._alpha * cosTheta;
    coeff = Math.pow(Math.abs(coeff), this._exponent);
  }
  this._lowpass.frequency.value = this._context.sampleRate * 0.5 * coeff;
}

/**
 * Set source's directivity pattern (defined by alpha), where 0 is an
 * omnidirectional pattern, 1 is a bidirectional pattern, 0.5 is a cardiod
 * pattern. The sharpness of the pattern is increased with the exponent.
 * @param {Number} alpha
 * Determines directivity pattern (0 to 1). Defaults to
 * {@linkcode Directivity.DEFAULT_ALPHA DEFAULT_ALPHA}.
 * @param {Number} exponent
 * Determines the steepness of the directivity pattern (1 to Inf). Defaults to
 * {@linkcode Directivity.DEFAULT_EXPONENT DEFAULT_EXPONENT}.
 */
Directivity.prototype.setPattern = function (alpha, exponent) {
  if (alpha == undefined) {
    alpha = Directivity.DEFAULT_ALPHA;
  }
  if (exponent == undefined) {
    exponent = Directivity.DEFAULT_EXPONENT;
  }

  // Clamp and set values.
  this._alpha = Math.min(1, Math.max(0, alpha));
  this._exponent = Math.max(1, exponent);

  // Update angle calculation using new values.
  this.computeAngle([this._cosTheta * this._cosTheta, 0, 0], [1, 0, 0]);
}

// Static variables
/**
 * The default alpha (i.e. microphone pattern).
 * @type {Number}
 */
Directivity.DEFAULT_ALPHA = 0;
/**
 * The default exponent (i.e. pattern sharpness).
 * @type {Number}
 */
Directivity.DEFAULT_EXPONENT = 1;

module.exports = Directivity;
