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
 * @file Distance-based attenuation filter.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';


// Internal dependencies.
const Utils = require('./utils.js');


/**
 * @class Attenuation
 * @description Distance-based attenuation filter.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Object} options
 * @param {Number} options.minDistance
 * Min. distance (in meters). Defaults to
 * {@linkcode Utils.DEFAULT_MIN_DISTANCE DEFAULT_MIN_DISTANCE}.
 * @param {Number} options.maxDistance
 * Max. distance (in meters). Defaults to
 * {@linkcode Utils.DEFAULT_MAX_DISTANCE DEFAULT_MAX_DISTANCE}.
 * @param {string} options.rolloff
 * Rolloff model to use, chosen from options in
 * {@linkcode Utils.ATTENUATION_ROLLOFFS ATTENUATION_ROLLOFFS}. Defaults to
 * {@linkcode Utils.DEFAULT_ATTENUATION_ROLLOFF DEFAULT_ATTENUATION_ROLLOFF}.
 */
function Attenuation(context, options) {
  // Public variables.
  /**
   * Min. distance (in meters).
   * @member {Number} minDistance
   * @memberof Attenuation
   * @instance
   */
  /**
   * Max. distance (in meters).
   * @member {Number} maxDistance
   * @memberof Attenuation
   * @instance
   */
  /**
   * Mono (1-channel) input {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} input
   * @memberof Attenuation
   * @instance
   */
  /**
   * Mono (1-channel) output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} output
   * @memberof Attenuation
   * @instance
   */

  // Use defaults for undefined arguments.
  if (options == undefined) {
    options = {};
  }
  if (options.minDistance == undefined) {
    options.minDistance = Utils.DEFAULT_MIN_DISTANCE;
  }
  if (options.maxDistance == undefined) {
    options.maxDistance = Utils.DEFAULT_MAX_DISTANCE;
  }
  if (options.rolloff == undefined) {
    options.rolloff = Utils.DEFAULT_ATTENUATION_ROLLOFF;
  }

  // Assign values.
  this.minDistance = options.minDistance;
  this.maxDistance = options.maxDistance;
  this.setRolloff(options.rolloff);

  // Create node.
  this._gainNode = context.createGain();

  // Initialize distance to max distance.
  this.setDistance(options.maxDistance);

  // Input/Output proxy.
  this.input = this._gainNode;
  this.output = this._gainNode;
}


/**
 * Set distance from the listener.
 * @param {Number} distance Distance (in meters).
 */
Attenuation.prototype.setDistance = function(distance) {
  let gain = 1;
  if (this._rolloff == 'logarithmic') {
    if (distance > this.maxDistance) {
      gain = 0;
    } else if (distance > this.minDistance) {
      let range = this.maxDistance - this.minDistance;
      if (range > Utils.EPSILON_FLOAT) {
        // Compute the distance attenuation value by the logarithmic curve
        // "1 / (d + 1)" with an offset of |minDistance|.
        let relativeDistance = distance - this.minDistance;
        let attenuation = 1 / (relativeDistance + 1);
        let attenuationMax = 1 / (range + 1);
        gain = (attenuation - attenuationMax) / (1 - attenuationMax);
      }
    }
  } else if (this._rolloff == 'linear') {
    if (distance > this.maxDistance) {
      gain = 0;
    } else if (distance > this.minDistance) {
      let range = this.maxDistance - this.minDistance;
      if (range > Utils.EPSILON_FLOAT) {
        gain = (this.maxDistance - distance) / range;
      }
    }
  }
  this._gainNode.gain.value = gain;
};


/**
 * Set rolloff.
 * @param {string} rolloff
 * Rolloff model to use, chosen from options in
 * {@linkcode Utils.ATTENUATION_ROLLOFFS ATTENUATION_ROLLOFFS}.
 */
Attenuation.prototype.setRolloff = function(rolloff) {
  let isValidModel = ~Utils.ATTENUATION_ROLLOFFS.indexOf(rolloff);
  if (rolloff == undefined || !isValidModel) {
    if (!isValidModel) {
      Utils.log('Invalid rolloff model (\"' + rolloff +
        '\"). Using default: \"' + Utils.DEFAULT_ATTENUATION_ROLLOFF + '\".');
    }
    rolloff = Utils.DEFAULT_ATTENUATION_ROLLOFF;
  } else {
    rolloff = rolloff.toString().toLowerCase();
  }
  this._rolloff = rolloff;
};


module.exports = Attenuation;
