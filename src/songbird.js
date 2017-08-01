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
 * @file Songbird library name space and common utilities.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';

/**
 * @class Songbird main namespace.
 */
var Songbird = {};

// Internal dependencies.
var Listener = require('./listener.js');
var Source = require('./source.js');

/**
 * Create {@link Listener Listener} to listen to
 * sources in a configurable environment.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Number} options.ambisonicOrder
 * Desired ambisonic order.
 * @param {Map} options.dimensions
 * Dimensions map which should conform to the layout of
 * {@link Room.DefaultDimensions Room.DefaultDimensions}
 * @param {Map} options.materials
 * Materials map which should conform to the layout of
 * {@link Room.DefaultMaterials Room.DefaultMaterials}
 * @param {Number} options.speedOfSound
 * (in meters / second).
 */
Songbird.createListener = function (context, options) {
  return new Listener(context, options);
}

/**
 * Create {@link Source Source} to spatialize an audio buffer.
 * @param {Listener} listener Associated Listener.
 * @param {Object} options
 * @param {Number} options.minDistance Min. distance (in meters).
 * @param {Number} options.maxDistance Max. distance (in meters).
 * @param {Number} options.gain Gain (linear).
 * @param {Float32Array} options.position Position [x,y,z] (in meters).
 * @param {Float32Array} options.velocity Velocity [x,y,z] (in meters).
 * @param {Float32Array} options.orientation Orientation [x,y,z] (in meters).
 */
Songbird.createSource = function(listener, options) {
  return new Source(listener, options);
}

module.exports = Songbird;