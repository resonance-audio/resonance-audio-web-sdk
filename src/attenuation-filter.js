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
 * @fileOverview Distance-based Attenuation Filter for an AudioBuffer.
 */

'use strict';

//TODO(bitllama) Add rolloff options.

/**
 * @class AttenuationFilter
 * @description Distance-based Attenuation Filter for an AudioBuffer.
 * @param {AudioContext} context            Associated AudioContext.
 * @param {Number} minDistance              Min. distance (in meters).
 * @param {Number} maxDistance              Max. distance (in meters).
 */
function AttenuationFilter (context, minDistance, maxDistance) {
  this._context = context;

  this._minDistance = Math.max(0, minDistance);
  this._maxDistance = Math.min(Number.MAX_VALUE, maxDistance);
  this._distance = 0;

  this._gainNode = this._context.createGain();

  this.setDistance(this._maxDistance);

  // Input/Output proxy.
  this.input = this._gainNode;
  this.output = this._gainNode;
}

AttenuationFilter.prototype.setDistance = function(distance) {
  var attenuation = 0;
  this._distance = Math.min(this._maxDistance, Math.max(this._minDistance, distance));
  if (this._distance > 0) {
    attenuation = 1 / this._distance;
  }
  this._gainNode.gain.value = attenuation;
}

module.exports = AttenuationFilter;