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
 * @fileOverview Ray-based Room Reflections model.
 */

'use strict';

// Internal dependencies.
var AttenuationFilter = require('./attenuation-filter.js');
var PropagationFilter = require('./propagation-filter.js');
var AmbisonicEncoder = require('./ambisonic-encoder.js');

/**
 * @class RoomReflectionsFilter
 * @description Ray-based Room Reflections model.
 * @param {AudioContext} context            Associated AudioContext
 * @param {Object} options
 * @param {Number} options.ambisonicOrder   Desired Ambisonic Order.
 * @param {Number} options.speedOfSound     Speed of Sound (in meters / second).
 * @param {Array} options.roomDimensions    Size dimensions in meters (w, h, d).
 * @param {Array} options.roomMaterials     Absorption coeffs (L,R,U,D,F,B).
 */
function RoomReflectionsFilter (context, options) {
  var maxDistance;
  var minDistance = 1;
  var azimuths = [-90, 90, 0, 0, 0, 180];
  var elevations = [0, 0, 90, -90, 0, 0];
  this._context = context;

  this._roomDimensions = options.roomDimensions;
  this._roomMaterials = options.roomMaterials;

  maxDistance = Math.sqrt(this._roomDimensions[0] * this._roomDimensions[0] +
                          this._roomDimensions[1] * this._roomDimensions[1] +
                          this._roomDimensions[2] * this._roomDimensions[2]);

  this.input = context.createGain();
  this.output = context.createGain();

  this._absorptions = Array(6);
  this._attenuations = Array(6);
  this._propagations = Array(6);
  this._encoders = Array(6);
  for (var i = 0; i < 6; i++) {
    // Construct nodes.
    this._absorptions[i] = context.createGain();
    this._attenuations[i] =
      new AttenuationFilter(context, minDistance, maxDistance);
    this._propagations[i] =
      new PropagationFilter(context, maxDistance, options.speedOfSound);
    this._encoders[i] = new AmbisonicEncoder(context, options.ambisonicOrder);

    // Constant intializations.
    this._absorptions[i].gain.value = Math.sqrt(1 - this._roomMaterials[i]);
    this._encoders[i].setDirection(azimuths[i], elevations[i]);

    // Connect in parallel.
    this.input.connect(this._absorptions[i]);
    this._absorptions[i].connect(this._attenuations[i].input);
    this._attenuations[i].output.connect(this._propagations[i].input);
    this._propagations[i].output.connect(this._encoders[i].input);
    this._encoders[i].output.connect(this.output);
  }

  // Place the listener in the middle of the room.
  this.setListenerPosition(this._roomDimensions[0] / 2,
                           this._roomDimensions[1] / 2,
                           this._roomDimensions[2] / 2);
}

RoomReflectionsFilter.prototype.setListenerPosition = function(x, y, z) {
  var distances = Array(6);
  distances[0] = 2 * x;
  distances[1] = 2 * this._roomDimensions[0] - distances[0];
  distances[2] = 2 * y;
  distances[3] = 2 * this._roomDimensions[1] - distances[2];
  distances[4] = 2 * z;
  distances[5] = 2 * this._roomDimensions[2] - distances[4];
  for (var i = 0; i < 6; i++) {
    this._attenuations[i].setDistance(distances[i]);
    this._propagations[i].setDistance(distances[i]);
  }
}

module.exports = RoomReflectionsFilter;