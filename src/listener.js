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
 * @fileOverview Listener model to spatialize sources in an environment.
 */

'use strict';

// Internal dependencies.
var RoomReflectionsFilter = require('./room-reflections-filter.js');
var LateReverbFilter = require('./late-reverb-filter.js');

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
function Listener (context, options) {
  this._context = context;

  this._options = options;

  this.early = this._context.createGain();
  this.late = this._context.createGain();
  this._earlyReflections =
    new RoomReflectionsFilter(this._context, this._options);
  this._lateReflections = new LateReverbFilter(this._context, this._options);
  this.output = this._context.createGain();

  this.early.connect(this._earlyReflections.input);
  this.late.connect(this._lateReflections.input);
  this._earlyReflections.output.connect(this.output);
  this._lateReflections.output.connect(this.output);

  // Initialize listener state.
  this.position = [this._options.roomDimensions[0] / 2,
                   this._options.roomDimensions[1] / 2,
                   this._options.roomDimensions[2] / 2];
  this.velocity = [0, 0, 0];
}

Listener.prototype.setPosition = function (x, y, z) {
  this.position[0] = x;
  this.position[1] = y;
  this.position[2] = z;
  this._earlyReflections.setListenerPosition(x, y, z);
}

Listener.prototype.setRoomProperties = function(dimensions, materials) {
  // Set new properties.
  this._options.roomDimensions = dimensions;
  this._options.roomMaterials = materials;

  // Disconnect reverb from pipeline.
  this.early.disconnect(this._earlyReflections);
  this._earlyReflections.output.disconnect(this.output);
  this.late.disconnect(this._lateReflections);
  this._lateReflections.output.disconnect(this.output);

  // Delete previous references.
  delete this._earlyReflections;
  delete this._lateReflections;

  // Replace with new objects.
  this._earlyReflections = new RoomReflectionsFilter(this._context, this._options);
  this._lateReflections = new LateReverbFilter(this._context, this._options);

  // Reconnect to the pipeline.
  this.early.connect(this._earlyReflections.input);
  this.late.connect(this._lateReflections.input);
  this._earlyReflections.output.connect(this.output);
  this._lateReflections.output.connect(this.output);
}

Listener.prototype.setRoomDimensions = function(w, h, d) {
  this.setRoomProperties([w, h, d], this._options.roomMaterials);
}

Listener.prototype.setRoomMaterials = function(l, r, b, f, d, u) {
  this.setRoomProperties(this._options.roomDimensions, [l, r, b, f, d, u]);
}

module.exports = Listener;