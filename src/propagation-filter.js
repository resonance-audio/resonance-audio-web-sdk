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
 * @fileOverview Propagation-delay Filter for an AudioBuffer.
 */

'use strict';

/**
 * @class PropagationFilter
 * @description Propagation-delay Filter for an AudioBuffer.
 * @param {AudioContext} context        Associated AudioContext.
 * @param {Number} maxDistance          Max. distance (in meters).
 * @param {Number} speedOfSound         Speed of Sound (in meters / second).
 *                                      Set to 0 to disable delayline.
 */
function PropagationFilter (context, maxDistance, speedOfSound) {
  var maxDelayInSecs;

  this._context = context;
  if (speedOfSound > 0) {
    this._recipSpeedOfSound = 1 / speedOfSound;
  } else {
    this._recipSpeedOfSound = 0;
  }

  this._maxDistance = maxDistance;
  this._distance = 0;

  maxDelayInSecs = this._maxDistance * this._recipSpeedOfSound;
  this._delayNode = this._context.createDelay(maxDelayInSecs);

  this.setDistance(maxDistance);

  // Input/Output proxy.
  this.input = this._delayNode;
  this.output = this._delayNode;
}

PropagationFilter.prototype.setDistance = function(distance) {
  var delay = 0;
  this._distance = Math.min(this._maxDistance, Math.max(0, distance));
  if (this._distance > 0) {
    delay = this._distance * this._recipSpeedOfSound;
  }
  this._delayNode.delayTime.value = delay;
}

module.exports = PropagationFilter;