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
 * @file Distance attenuation filter.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';

// Internal dependencies.
var Globals = require('./globals.js');
var Utils = require('./utils.js');

/**
 * @class Attenuation
 * @description Distance attenuation filter.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Object} options
 * @param {Number} options.minDistance Min. distance (in meters).
 * @param {Number} options.maxDistance Max. distance (in meters).
 * @param {string} options.rolloffModel
 * Rolloff model to use, chosen from options in
 * {@link Globals.RolloffModels Global.RolloffModels}.
 */
function Attenuation (context, options) {
  // Public variables.
  /**
   * Minimum distance from the listener (in meters).
   * @member {Number} minDistance
   * @memberof Attenuation
   */
  /**
   * Maximum distance from the listener (in meters).
   * @member {Number} maxDistance
   * @memberof Attenuation
   */
  /**
   * Input to .connect() input AudioNodes to.
   * @member {AudioNode} input
   * @memberof Attenuation
   */
  /**
   * Outuput to .connect() object from.
   * @member {AudioNode} output
   * @memberof Attenuation
   */

  // Use defaults for undefined arguments
  if (options == undefined) {
    options = new Object();
  }
  if (options.minDistance == undefined) {
    options.minDistance = Globals.DefaultMinDistance;
  }
  if (options.maxDistance == undefined) {
    options.maxDistance = Globals.DefaultMaxDistance;
  }
  if (options.rollofModel == undefined) {
    options.rolloffModel = Globals.DefaultRolloffModel;
  }

  // Assign values.
  this.minDistance = options.minDistance;
  this.maxDistance = options.maxDistance;
  this.setRolloffModel(options.rolloffModel);

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
  var gain = 1;
  if (this._rolloffModel == 'logarithmic') {
    if (distance > this.maxDistance) {
      gain = 0;
    } else if (distance > this.minDistance) {
      var range = this.maxDistance - this.minDistance;
      if (range > Globals.EpsilonFloat) {
        // Compute the distance attenuation value by the logarithmic curve
        // "1 / (d + 1)" with an offset of |minDistance|.
        var relativeDistance = distance - this.minDistance;
        var attenuation = 1 / (relativeDistance + 1);
        var attenuationMax = 1 / (range + 1);
        gain = (attenuation - attenuationMax) / (1 - attenuationMax);
      }
    }
  } else if (this._rolloffModel == 'linear') {
    if (distance > this.maxDistance) {
      gain = 0;
    } else if (distance > this.minDistance) {
      var range = this.maxDistance - this.minDistance;
      if (range > Globals.EpsilonFloat) {
        gain = (this.maxDistance - distance) / range;
      }
    }
  }
  this._gainNode.gain.value = gain;
}

/**
 * Set rolloff model.
 * @param {string} rolloffModel
 * Rolloff model to use, chosen from options in
 * {@link Globals.RolloffModels Global.RolloffModels}.
 */
Attenuation.prototype.setRolloffModel = function (rolloffModel) {
  rolloffModel = rolloffModel.toString().toLowerCase();
  var isValidModel = ~Globals.RolloffModels.indexOf(rolloffModel);
  if (rolloffModel == undefined || !isValidModel) {
    if (!isValidModel) {
      Utils.log('Invalid rolloff model (\"' + rolloffModel +
        '\"). Using default: \"' + Globals.DefaultRolloffModel + '\".');
    }
    rolloffModel = Globals.DefaultRolloffModel;
  }
  this._rolloffModel = rolloffModel;
}

module.exports = Attenuation;