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
 * @file Complete room model with early and late reflections.
 * @author Andrew Allen <bitllama@google.com>
 */

'use strict';


// Internal dependencies.
const LateReflections = require('./late-reflections.js');
const EarlyReflections = require('./early-reflections.js');
const Utils = require('./utils.js');


/**
 * Generate absorption coefficients from material names.
 * @param {Object} materials
 * @return {Object}
 */
function _getCoefficientsFromMaterials(materials) {
  // Initialize coefficients to use defaults.
  let coefficients = {};
  for (let property in Utils.DEFAULT_ROOM_MATERIALS) {
    if (Utils.DEFAULT_ROOM_MATERIALS.hasOwnProperty(property)) {
      coefficients[property] = Utils.ROOM_MATERIAL_COEFFICIENTS[
        Utils.DEFAULT_ROOM_MATERIALS[property]];
    }
  }

  // Sanitize materials.
  if (materials == undefined) {
    materials = {};
    Object.assign(materials, Utils.DEFAULT_ROOM_MATERIALS);
  }

  // Assign coefficients using provided materials.
  for (let property in Utils.DEFAULT_ROOM_MATERIALS) {
    if (Utils.DEFAULT_ROOM_MATERIALS.hasOwnProperty(property) &&
        materials.hasOwnProperty(property)) {
      if (materials[property] in Utils.ROOM_MATERIAL_COEFFICIENTS) {
        coefficients[property] =
          Utils.ROOM_MATERIAL_COEFFICIENTS[materials[property]];
      } else {
        Utils.log('Material \"' + materials[property] + '\" on wall \"' +
          property + '\" not found. Using \"' +
          Utils.DEFAULT_ROOM_MATERIALS[property] + '\".');
      }
    } else {
      Utils.log('Wall \"' + property + '\" is not defined. Default used.');
    }
  }
  return coefficients;
}

/**
 * Sanitize coefficients.
 * @param {Object} coefficients
 * @return {Object}
 */
function _sanitizeCoefficients(coefficients) {
  if (coefficients == undefined) {
    coefficients = {};
  }
  for (let property in Utils.DEFAULT_ROOM_MATERIALS) {
    if (!(coefficients.hasOwnProperty(property))) {
      // If element is not present, use default coefficients.
      coefficients[property] = Utils.ROOM_MATERIAL_COEFFICIENTS[
        Utils.DEFAULT_ROOM_MATERIALS[property]];
    }
  }
  return coefficients;
}

/**
 * Sanitize dimensions.
 * @param {Utils~RoomDimensions} dimensions
 * @return {Utils~RoomDimensions}
 */
function _sanitizeDimensions(dimensions) {
  if (dimensions == undefined) {
    dimensions = {};
  }
  for (let property in Utils.DEFAULT_ROOM_DIMENSIONS) {
    if (!(dimensions.hasOwnProperty(property))) {
      dimensions[property] = Utils.DEFAULT_ROOM_DIMENSIONS[property];
    }
  }
  return dimensions;
}

/**
 * Compute frequency-dependent reverb durations.
 * @param {Utils~RoomDimensions} dimensions
 * @param {Object} coefficients
 * @param {Number} speedOfSound
 * @return {Array}
 */
function _getDurationsFromProperties(dimensions, coefficients, speedOfSound) {
  let durations = new Float32Array(Utils.NUMBER_REVERB_FREQUENCY_BANDS);

  // Sanitize inputs.
  dimensions = _sanitizeDimensions(dimensions);
  coefficients = _sanitizeCoefficients(coefficients);
  if (speedOfSound == undefined) {
    speedOfSound = Utils.DEFAULT_SPEED_OF_SOUND;
  }

  // Acoustic constant.
  let k = Utils.TWENTY_FOUR_LOG10 / speedOfSound;

  // Compute volume, skip if room is not present.
  let volume = dimensions.width * dimensions.height * dimensions.depth;
  if (volume < Utils.ROOM_MIN_VOLUME) {
    return durations;
  }

  // Room surface area.
  let leftRightArea = dimensions.width * dimensions.height;
  let floorCeilingArea = dimensions.width * dimensions.depth;
  let frontBackArea = dimensions.depth * dimensions.height;
  let totalArea = 2 * (leftRightArea + floorCeilingArea + frontBackArea);
  for (let i = 0; i < Utils.NUMBER_REVERB_FREQUENCY_BANDS; i++) {
    // Effective absorptive area.
    let absorbtionArea =
      (coefficients.left[i] + coefficients.right[i]) * leftRightArea +
      (coefficients.down[i] + coefficients.up[i]) * floorCeilingArea +
      (coefficients.front[i] + coefficients.back[i]) * frontBackArea;
    let meanAbsorbtionArea = absorbtionArea / totalArea;

    // Compute reverberation using Eyring equation [1].
    // [1] Beranek, Leo L. "Analysis of Sabine and Eyring equations and their
    //     application to concert hall audience and chair absorption." The
    //     Journal of the Acoustical Society of America, Vol. 120, No. 3.
    //     (2006), pp. 1399-1399.
    durations[i] = Utils.ROOM_EYRING_CORRECTION_COEFFICIENT * k * volume /
      (-totalArea * Math.log(1 - meanAbsorbtionArea) + 4 *
      Utils.ROOM_AIR_ABSORPTION_COEFFICIENTS[i] * volume);
  }
  return durations;
}


/**
 * Compute reflection coefficients from absorption coefficients.
 * @param {Object} absorptionCoefficients
 * @return {Object}
 */
function _computeReflectionCoefficients(absorptionCoefficients) {
  let reflectionCoefficients = [];
  for (let property in Utils.DEFAULT_REFLECTION_COEFFICIENTS) {
    if (Utils.DEFAULT_REFLECTION_COEFFICIENTS
        .hasOwnProperty(property)) {
      // Compute average absorption coefficient (per wall).
      reflectionCoefficients[property] = 0;
      for (let j = 0; j < Utils.NUMBER_REFLECTION_AVERAGING_BANDS; j++) {
        let bandIndex = j + Utils.ROOM_STARTING_AVERAGING_BAND;
        reflectionCoefficients[property] +=
          absorptionCoefficients[property][bandIndex];
      }
      reflectionCoefficients[property] /=
        Utils.NUMBER_REFLECTION_AVERAGING_BANDS;

      // Convert absorption coefficient to reflection coefficient.
      reflectionCoefficients[property] =
        Math.sqrt(1 - reflectionCoefficients[property]);
    }
  }
  return reflectionCoefficients;
}


/**
 * @class Room
 * @description Model that manages early and late reflections using acoustic
 * properties and listener position relative to a rectangular room.
 * @param {AudioContext} context
 * Associated {@link
https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
 * @param {Object} options
 * @param {Float32Array} options.listenerPosition
 * The listener's initial position (in meters), where origin is the center of
 * the room. Defaults to {@linkcode Utils.DEFAULT_POSITION DEFAULT_POSITION}.
 * @param {Utils~RoomDimensions} options.dimensions Room dimensions (in meters). Defaults to
 * {@linkcode Utils.DEFAULT_ROOM_DIMENSIONS DEFAULT_ROOM_DIMENSIONS}.
 * @param {Utils~RoomMaterials} options.materials Named acoustic materials per wall.
 * Defaults to {@linkcode Utils.DEFAULT_ROOM_MATERIALS DEFAULT_ROOM_MATERIALS}.
 * @param {Number} options.speedOfSound
 * (in meters/second). Defaults to
 * {@linkcode Utils.DEFAULT_SPEED_OF_SOUND DEFAULT_SPEED_OF_SOUND}.
 */
function Room(context, options) {
  // Public variables.
  /**
   * EarlyReflections {@link EarlyReflections EarlyReflections} submodule.
   * @member {AudioNode} early
   * @memberof Room
   * @instance
   */
  /**
   * LateReflections {@link LateReflections LateReflections} submodule.
   * @member {AudioNode} late
   * @memberof Room
   * @instance
   */
  /**
   * Ambisonic (multichannel) output {@link
   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
   * @member {AudioNode} output
   * @memberof Room
   * @instance
   */

  // Use defaults for undefined arguments.
  if (options == undefined) {
    options = {};
  }
  if (options.listenerPosition == undefined) {
    options.listenerPosition = Utils.DEFAULT_POSITION.slice();
  }
  if (options.dimensions == undefined) {
    options.dimensions = {};
    Object.assign(options.dimensions, Utils.DEFAULT_ROOM_DIMENSIONS);
  }
  if (options.materials == undefined) {
    options.materials = {};
    Object.assign(options.materials, Utils.DEFAULT_ROOM_MATERIALS);
  }
  if (options.speedOfSound == undefined) {
    options.speedOfSound = Utils.DEFAULT_SPEED_OF_SOUND;
  }

  // Sanitize room-properties-related arguments.
  options.dimensions = _sanitizeDimensions(options.dimensions);
  let absorptionCoefficients = _getCoefficientsFromMaterials(options.materials);
  let reflectionCoefficients =
    _computeReflectionCoefficients(absorptionCoefficients);
  let durations = _getDurationsFromProperties(options.dimensions,
    absorptionCoefficients, options.speedOfSound);

  // Construct submodules for early and late reflections.
  this.early = new EarlyReflections(context, {
    dimensions: options.dimensions,
    coefficients: reflectionCoefficients,
    speedOfSound: options.speedOfSound,
    listenerPosition: options.listenerPosition,
  });
  this.late = new LateReflections(context, {
    durations: durations,
  });

  this.speedOfSound = options.speedOfSound;

  // Construct auxillary audio nodes.
  this.output = context.createGain();
  this.early.output.connect(this.output);
  this._merger = context.createChannelMerger(4);

  this.late.output.connect(this._merger, 0, 0);
  this._merger.connect(this.output);
}


/**
 * Set the room's dimensions and wall materials.
 * @param {Utils~RoomDimensions} dimensions Room dimensions (in meters). Defaults to
 * {@linkcode Utils.DEFAULT_ROOM_DIMENSIONS DEFAULT_ROOM_DIMENSIONS}.
 * @param {Utils~RoomMaterials} materials Named acoustic materials per wall. Defaults to
 * {@linkcode Utils.DEFAULT_ROOM_MATERIALS DEFAULT_ROOM_MATERIALS}.
 */
Room.prototype.setProperties = function(dimensions, materials) {
  // Compute late response.
  let absorptionCoefficients = _getCoefficientsFromMaterials(materials);
  let durations = _getDurationsFromProperties(dimensions,
    absorptionCoefficients, this.speedOfSound);
  this.late.setDurations(durations);

  // Compute early response.
  this.early.speedOfSound = this.speedOfSound;
  let reflectionCoefficients =
    _computeReflectionCoefficients(absorptionCoefficients);
  this.early.setRoomProperties(dimensions, reflectionCoefficients);
};


/**
 * Set the listener's position (in meters), where origin is the center of
 * the room.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Room.prototype.setListenerPosition = function(x, y, z) {
  this.early.speedOfSound = this.speedOfSound;
  this.early.setListenerPosition(x, y, z);

  // Disable room effects if the listener is outside the room boundaries.
  let distance = this.getDistanceOutsideRoom(x, y, z);
  let gain = 1;
  if (distance > Utils.EPSILON_FLOAT) {
    gain = 1 - distance / Utils.LISTENER_MAX_OUTSIDE_ROOM_DISTANCE;

    // Clamp gain between 0 and 1.
    gain = Math.max(0, Math.min(1, gain));
  }
  this.output.gain.value = gain;
};


/**
 * Compute distance outside room of provided position (in meters).
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @return {Number}
 * Distance outside room (in meters). Returns 0 if inside room.
 */
Room.prototype.getDistanceOutsideRoom = function(x, y, z) {
  let dx = Math.max(0, -this.early._halfDimensions.width - x,
    x - this.early._halfDimensions.width);
    let dy = Math.max(0, -this.early._halfDimensions.height - y,
    y - this.early._halfDimensions.height);
    let dz = Math.max(0, -this.early._halfDimensions.depth - z,
    z - this.early._halfDimensions.depth);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};


module.exports = Room;
