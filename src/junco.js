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
 * @fileOverview Junco library name space and common utilities.
 */

'use strict';

/**
 * @class Junco main namespace.
 */
var Junco = {};

// Internal dependencies.
var Listener = require('./listener.js');
var Source = require('./source.js');

/**
 * @class Listener
 * @description Listener model to spatialize sources in an environment.
 * @param {AudioContext} context            Associated AudioContext.
 * @param {Object} options
 * @param {Number} options.ambisonicOrder   Desired Ambisonic Order.
 * @param {Number} options.speedOfSound     Speed of Sound (in meters / second).
 * @param {Array} options.roomDimensions    Size dimensions in meters (w, h, d).
 * @param {Array} options.roomMaterials     Absorption coeffs (L,R,U,D,F,B).
 */
Junco.createListener = function (context, options) {
  return new Listener(context, options);
}

/**
 * @class Source
 * @description Source model to spatialize an AudioBuffer.
 * @param {AudioContext} context            Associated AudioContext.
 * @param {Object} options
 * @param {Number} options.minDistance      Min. distance (in meters).
 * @param {Number} options.maxDistance      Max. distance (in meters).
 */
Junco.createSource = function(listener, options) {
  return new Source(listener, options);
}

module.exports = Junco;