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
var LateReflections = require('./late-reflections.js');
var EarlyReflections = require('./early-reflections.js');
var Utils = require('./utils.js');

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
 * the room. Defaults to {@linkcode DEFAULT_POSITION DEFAULT_POSITION}.
 * @param {Object} options.dimensions Room dimensions (in meters). Defaults to
 * {@linkcode EarlyReflections.DEFAULT_DIMENSIONS DEFAULT_DIMENSIONS}.
 * @param {Object} options.materials Named acoustic materials per wall.
 * Defaults to {@linkcode Room.DEFAULT_MATERIALS DEFAULT_MATERIALS}.
 * @param {Number} options.speedOfSound
 * (in meters/second). Defaults to
 * {@linkcode DEFAULT_SPEED_OF_SOUND DEFAULT_SPEED_OF_SOUND}.
 * @param {Boolean} options.useLateReflections Enables/disables
 * {@link LateReflections LateReflections}, which uses a convolution reverb.
 * Can be disabled to improve performance on low-power devices. Defaults to
 * {@linkcode Room.USE_LATE_REFLECTIONS USE_LATE_REFLECTIONS}.
 */
function Room (context, options) {
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
    options = new Object();
  }
  if (options.listenerPosition == undefined) {
    options.listenerPosition = Utils.DEFAULT_POSITION;
  }
  if (options.dimensions == undefined) {
    options.dimensions = EarlyReflections.DEFAULT_DIMENSIONS;
  }
  if (options.materials == undefined) {
    options.materials = Room.DEFAULT_MATERIALS;
  }
  if (options.speedOfSound == undefined) {
    options.speedOfSound = Utils.DEFAULT_SPEED_OF_SOUND;
  }
  if (options.useLateReflections == undefined) {
    options.useLateReflections = Room.USE_LATE_REFLECTIONS;
  }

  // Sanitize room-properties-related arguments.
  options.dimensions = _sanitizeDimensions(options.dimensions);
  var absorptionCoefficients = _getCoefficientsFromMaterials(options.materials);
  var reflectionCoefficients =
    _computeReflectionCoefficients(absorptionCoefficients);

  // Construct submodules for early and late reflections.
  this.early = new EarlyReflections(context, {
    dimensions : options.dimensions,
    coefficients : reflectionCoefficients,
    speedOfSound : options.speedOfSound,
    listenerPosition : options.listenerPosition
  });

  this._useLateReflections = options.useLateReflections;
  this.speedOfSound = options.speedOfSound;

  // Construct auxillary audio nodes.
  this.output = context.createGain();
  this.early.output.connect(this.output);

  // Only construct the late reflections if not disabled.
  if (this._useLateReflections) {
    var durations = _getDurationsFromProperties(options.dimensions,
      absorptionCoefficients, options.speedOfSound);
    this.late = new LateReflections(context, {
      durations : durations
    });

    this._merger = context.createChannelMerger(4);

    this.late.output.connect(this._merger, 0, 0);
    this._merger.connect(this.output);
  }
}

/**
 * Set the room's dimensions and wall materials.
 * @param {Object} dimensions Room dimensions (in meters). Defaults to
 * {@linkcode EarlyReflections.DEFAULT_DIMENSIONS DEFAULT_DIMENSIONS}.
 * @param {Object} materials Named acoustic materials per wall. Defaults to
 * {@linkcode Room.DEFAULT_MATERIALS DEFAULT_MATERIALS}.
 */
Room.prototype.setProperties = function (dimensions, materials) {
  // Compute late response, skip if disabled.
  if (this._useLateReflections) {
    var absorptionCoefficients = _getCoefficientsFromMaterials(materials);
    var durations = _getDurationsFromProperties(dimensions,
      absorptionCoefficients, this.speedOfSound);
    this.late.setDurations(durations);
  }

  // Compute early response.
  this.early.speedOfSound = this.speedOfSound;
  var reflectionCoefficients =
    _computeReflectionCoefficients(absorptionCoefficients);
  this.early.setRoomProperties(dimensions, reflectionCoefficients);
}

/**
 * Set the listener's position (in meters), where origin is the center of
 * the room.
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 */
Room.prototype.setListenerPosition = function (x, y, z) {
  this.early.speedOfSound = this.speedOfSound;
  this.early.setListenerPosition(x, y, z);

  // Disable room effects if the listener is outside the room boundaries.
  var distance = this.getDistanceOutsideRoom(x, y, z);
  var gain = 1;
  if (distance > Utils.EPSILON_FLOAT) {
    gain = 1 - distance / Room.LISTENER_MAX_OUTSIDE_ROOM_DISTANCE;

    // Clamp gain between 0 and 1.
    gain = Math.max(0, Math.min(1, gain));
  }
  this.output.gain.value = gain;
}

/**
 * Compute distance outside room of provided position (in meters).
 * @param {Number} x
 * @param {Number} y
 * @param {Number} z
 * @returns {Number}
 * Distance outside room (in meters). Returns 0 if inside room.
 */
Room.prototype.getDistanceOutsideRoom = function (x, y, z) {
  var dx = Math.max(0, -this.early._halfDimensions.width - x,
    x - this.early._halfDimensions.width);
  var dy = Math.max(0, -this.early._halfDimensions.height - y,
    y - this.early._halfDimensions.height);
  var dz = Math.max(0, -this.early._halfDimensions.depth - z,
    z - this.early._halfDimensions.depth);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Static constants.
/**
 * Pre-defined frequency-dependent absorption coefficients for listed materials.
 * Currently supported materials are:
 * <ul>
 * <li>'transparent'</li>
 * <li>'acoustic-ceiling-tiles'</li>
 * <li>'brick-bare'</li>
 * <li>'brick-painted'</li>
 * <li>'concrete-block-coarse'</li>
 * <li>'concrete-block-painted'</li>
 * <li>'curtain-heavy'</li>
 * <li>'fiber-glass-insulation'</li>
 * <li>'glass-thin'</li>
 * <li>'glass-thick'</li>
 * <li>'grass'</li>
 * <li>'linoleum-on-concrete'</li>
 * <li>'marble'</li>
 * <li>'metal'</li>
 * <li>'parquet-on-concrete'</li>
 * <li>'plaster-smooth'</li>
 * <li>'plywood-panel'</li>
 * <li>'polished-concrete-or-tile'</li>
 * <li>'sheetrock'</li>
 * <li>'water-or-ice-surface'</li>
 * <li>'wood-ceiling'</li>
 * <li>'wood-panel'</li>
 * <li>'uniform'</li>
 * </ul>
 * @type {Object}
 */
Room.MATERIAL_COEFFICIENTS = {
  'transparent' :
  [1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000, 1.000],
  'acoustic-ceiling-tiles' :
  [0.672, 0.675, 0.700, 0.660, 0.720, 0.920, 0.880, 0.750, 1.000],
  'brick-bare' :
  [0.030, 0.030, 0.030, 0.030, 0.030, 0.040, 0.050, 0.070, 0.140],
  'brick-painted' :
  [0.006, 0.007, 0.010, 0.010, 0.020, 0.020, 0.020, 0.030, 0.060],
  'concrete-block-coarse' :
  [0.360, 0.360, 0.360, 0.440, 0.310, 0.290, 0.390, 0.250, 0.500],
  'concrete-block-painted' :
  [0.092, 0.090, 0.100, 0.050, 0.060, 0.070, 0.090, 0.080, 0.160],
  'curtain-heavy' :
  [0.073, 0.106, 0.140, 0.350, 0.550, 0.720, 0.700, 0.650, 1.000],
  'fiber-glass-insulation' :
  [0.193, 0.220, 0.220, 0.820, 0.990, 0.990, 0.990, 0.990, 1.000],
  'glass-thin' :
  [0.180, 0.169, 0.180, 0.060, 0.040, 0.030, 0.020, 0.020, 0.040],
  'glass-thick' :
  [0.350, 0.350, 0.350, 0.250, 0.180, 0.120, 0.070, 0.040, 0.080],
  'grass' :
  [0.050, 0.050, 0.150, 0.250, 0.400, 0.550, 0.600, 0.600, 0.600],
  'linoleum-on-concrete' :
  [0.020, 0.020, 0.020, 0.030, 0.030, 0.030, 0.030, 0.020, 0.040],
  'marble' :
  [0.010, 0.010, 0.010, 0.010, 0.010, 0.010, 0.020, 0.020, 0.0400],
  'metal' :
  [0.030, 0.035, 0.040, 0.040, 0.050, 0.050, 0.050, 0.070, 0.090],
  'parquet-on-concrete' :
  [0.028, 0.030, 0.040, 0.040, 0.070, 0.060, 0.060, 0.070, 0.140],
  'plaster-rough' :
  [0.017, 0.018, 0.020, 0.030, 0.040, 0.050, 0.040, 0.030, 0.060],
  'plaster-smooth' :
  [0.011, 0.012, 0.013, 0.015, 0.020, 0.030, 0.040, 0.050, 0.100],
  'plywood-panel' :
  [0.400, 0.340, 0.280, 0.220, 0.170, 0.090, 0.100, 0.110, 0.220],
  'polished-concrete-or-tile' :
  [0.008, 0.008, 0.010, 0.010, 0.015, 0.020, 0.020, 0.020, 0.040],
  'sheet-rock' :
  [0.290, 0.279, 0.290, 0.100, 0.050, 0.040, 0.070, 0.090, 0.180],
  'water-or-ice-surface' :
  [0.006, 0.006, 0.008, 0.008, 0.013, 0.015, 0.020, 0.025, 0.050],
  'wood-ceiling' :
  [0.150, 0.147, 0.150, 0.110, 0.100, 0.070, 0.060, 0.070, 0.140],
  'wood-panel' :
  [0.280, 0.280, 0.280, 0.220, 0.170, 0.090, 0.100, 0.110, 0.220],
  'uniform' :
  [0.500, 0.500, 0.500, 0.500, 0.500, 0.500, 0.500, 0.500, 0.500]
}
/**
 * Default materials that use strings from
 * {@linkcode Room.MATERIAL_COEFFICIENTS MATERIAL_COEFFICIENTS}
 * @type {Object}
 */
Room.DEFAULT_MATERIALS = {
  left : 'transparent', right : 'transparent', front : 'transparent',
  back : 'transparent', down : 'transparent', up : 'transparent'
};
/**
 * The number of bands to average over when computing reflection coefficients.
 * @type {Number}
 */
Room.NUMBER_AVERAGING_BANDS = 3;
/**
 * The starting band to average over when computing reflection coefficients.
 * @type {Number}
 */
Room.STARTING_AVERAGING_BAND = 4;
/**
 * The minimum threshold for room volume.
 * Room model is disabled if volume is below this value.
 * @type {Number} */
Room.MIN_ROOM_VOLUME = 1e-4;
/**
 * Air absorption coefficients per frequency band.
 * @type {Float32Array}
 */
Room.AIR_ABSORPTION_COEFFICIENTS =
  [0.0006, 0.0006, 0.0007, 0.0008, 0.0010, 0.0015, 0.0026, 0.0060, 0.0207];
/**
 * A scalar correction value to ensure Sabine and Eyring produce the same RT60
 * value at the cross-over threshold.
 * @type {Number} */
Room.EYRING_CORRECTION = 1.38;
/**
 * Maximum outside-the-room distance to attenuate far-field listener by.
 * @type {Number}
 */
Room.LISTENER_MAX_OUTSIDE_ROOM_DISTANCE = 1;
/**
 * Set to 'true' by default. Can be disabled to improve performance on low-power
 * devices.
 * @type {Boolean}
 */
Room.USE_LATE_REFLECTIONS = true;

// Helper functions.
function _getCoefficientsFromMaterials (materials) {
  // Initialize coefficients to use defaults.
  var coefficients = {};
  for (var property in Room.DEFAULT_MATERIALS) {
    coefficients[property] =
      Room.MATERIAL_COEFFICIENTS[Room.DEFAULT_MATERIALS[property]];
  }

  // Sanitize materials.
  if (materials == undefined) {
    materials = Room.DEFAULT_MATERIALS;
  }

  // Assign coefficients using provided materials.
  for (var property in Room.DEFAULT_MATERIALS) {
    if (materials.hasOwnProperty(property)) {
      if (materials[property] in Room.MATERIAL_COEFFICIENTS) {
        coefficients[property] =
          Room.MATERIAL_COEFFICIENTS[materials[property]];
      } else {
        Utils.log('Material \"' + materials[property] + '\" on wall \"' +
          property + '\" not found. Using \"' +
          Room.DEFAULT_MATERIALS[property] + '\".');
      }
    } else {
      Utils.log('Wall \"' + property + '\" is not defined. Default used.');
    }
  }
  return coefficients;
}

function _sanitizeCoefficients (coefficients) {
  if (coefficients == undefined) {
    coefficients = {};
  }
  for (var property in Room.DEFAULT_MATERIALS) {
    if (!(coefficients.hasOwnProperty(property))) {
      // If element is not present, use default coefficients.
      coefficients[property] =
        Room.MATERIAL_COEFFICIENTS[Room.DEFAULT_MATERIALS[property]];
    }
  }
  return coefficients;
}

function _sanitizeDimensions (dimensions) {
  if (dimensions == undefined) {
    dimensions = {};
  }
  for (var property in EarlyReflections.DEFAULT_DIMENSIONS) {
    if (!(dimensions.hasOwnProperty(property))) {
      dimensions[property] = EarlyReflections.DEFAULT_DIMENSIONS[property];
    }
  }
  return dimensions;
}

function _getDurationsFromProperties (dimensions, coefficients, speedOfSound) {
  var durations = new Float32Array(LateReflections.NUMBER_FREQUENCY_BANDS);

  // Sanitize inputs.
  dimensions = _sanitizeDimensions(dimensions);
  coefficients = _sanitizeCoefficients(coefficients);
  if (speedOfSound == undefined) {
    speedOfSound = Utils.DEFAULT_SPEED_OF_SOUND;
  }

  // Acoustic constant.
  var k = Utils.TWENTY_FOUR_LOG10 / speedOfSound;

  // Compute volume, skip if room is not present.
  var volume = dimensions.width * dimensions.height * dimensions.depth;
  if (volume < Room.MIN_ROOM_VOLUME) {
    return durations;
  }

  // Room surface area.
  var leftRightArea = dimensions.width * dimensions.height;
  var floorCeilingArea = dimensions.width * dimensions.depth;
  var frontBackArea = dimensions.depth * dimensions.height;
  var totalArea = 2 * (leftRightArea + floorCeilingArea + frontBackArea);
  for (var i = 0; i < LateReflections.NUMBER_FREQUENCY_BANDS; i++) {
    // Effective absorptive area.
    var absorbtionArea =
      (coefficients.left[i] + coefficients.right[i]) * leftRightArea +
      (coefficients.down[i] + coefficients.up[i]) * floorCeilingArea +
      (coefficients.front[i] + coefficients.back[i]) * frontBackArea;
    var meanAbsorbtionArea = absorbtionArea / totalArea;

    // Compute reverberation using one of two algorithms, depending on area [1].
    // [1] Beranek, Leo L. "Analysis of Sabine and Eyring equations and their
    //     application to concert hall audience and chair absorption." The
    //     Journal of the Acoustical Society of America, Vol. 120, No. 3.
    //     (2006), pp. 1399-1399.
    if (meanAbsorbtionArea <= 0.5) {
      // Sabine equation.
      durations[i] = k * volume / (absorbtionArea + 4 *
        Room.AIR_ABSORPTION_COEFFICIENTS[i] * volume);
    } else {
      // Eyring equation.
      durations[i] = Room.EYRING_CORRECTION * k * volume / (-totalArea *
        Math.log(1 - meanAbsorbtionArea) + 4 *
        Room.AIR_ABSORPTION_COEFFICIENTS[i] * volume);
    }
  }
  return durations;
}

function _computeReflectionCoefficients (absorptionCoefficients) {
  var reflectionCoefficients = [];
  for (var property in EarlyReflections.DEFAULT_REFLECTION_COEFFICIENTS) {
    // Compute average absorption coefficient (per wall).
    reflectionCoefficients[property] = 0;
    for (var j = 0; j < Room.NUMBER_AVERAGING_BANDS; j++) {
      var bandIndex = j + Room.STARTING_AVERAGING_BAND;
      reflectionCoefficients[property] +=
        absorptionCoefficients[property][bandIndex];
    }
    reflectionCoefficients[property] /= Room.NUMBER_AVERAGING_BANDS;

    // Convert absorption coefficient to reflection coefficient.
    reflectionCoefficients[property] =
      Math.sqrt(1 - reflectionCoefficients[property]);
  }
  return reflectionCoefficients;
}

module.exports = Room;
