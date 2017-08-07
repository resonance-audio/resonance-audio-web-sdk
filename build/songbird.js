(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else {
		var a = factory();
		for(var i in a) (typeof exports === 'object' ? exports : root)[i] = a[i];
	}
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

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

	'use strict';

	// Primary namespace for Songbird library.
	exports.Songbird = __webpack_require__(1);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

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

	// Internal dependencies.
	//var AmbisonicEncoder = require('./ambisonic-encoder.js');
	//var Attenuation = require('./attenuation.js');
	//var Listener = require('./listener.js');
	var Source = __webpack_require__(7);
	var Room = __webpack_require__(2);
	var LateReflections = __webpack_require__(5);
	var EarlyReflections = __webpack_require__(6);
	var Global = __webpack_require__(3);

	/**
	 * @class Songbird spatial audio.
	 * @description Main class for managing sources, room and listener models.
	 * @param {AudioContext} context
	 * Associated {@link
	https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
	 * @param {Object} options
	 * @param {Number} ambisonicOrder
	 * @param {Float32Array} listenerPosition
	 */
	function Songbird (context, options) {
	  this._context = context;
	  if (options == undefined) {
	    options = new Object();
	  }
	  if (options.ambisonicOrder == undefined) {
	    options.ambisonicOrder = Global.DEFAULT_AMBISONIC_ORDER;
	  }
	  this._ambisonicOrder = options.ambisonicOrder;

	  // Member submodules.
	  this._sources = [];
	  this._room = new Room(context);

	  // Member variables.
	  this._position = new Float32Array(3);

	  // Create auxillary audio nodes.
	  this.output = context.createGain();

	  // Connect audio graph.
	  this._room.output.connect(this.output);
	}

	Songbird.prototype.createSource = function (audioNode, options) {
	  this._sources.push(new Source(this, options));
	  audioNode.connect(this._sources[this._sources.length - 1].input);
	  return this._sources[this._sources.length - 1];
	}

	Songbird.prototype.removeSource = function (source) {
	  var index = this._sources.indexOf(source);
	  if (index > -1) {
	    this._sources.splice(index, 1);
	  } else {
	    Utils.log("Error: Source not found, not removed!");
	  }
	}

	Songbird.prototype.setRoomProperties = function (dimensions, materials) {
	  this._room.setProperties(dimensions, materials);
	}

	Songbird.prototype.setListenerPosition = function (x, y, z) {
	  this._position[0] = x;
	  this._position[1] = y;
	  this._position[2] = z;
	  this._room.setListenerPosition(x, y, z);
	  for (var i = 0; i < this._sources.length; i++) {
	    this._sources[i].setPosition(this._sources[i]._position[0],
	      this._sources[i]._position[1], this._sources[i]._position[2]);
	  }
	}

	Songbird.prototype.setListenerOrientation = function (roll, pitch, yaw) {
	  //TODO(bitllama): Omnitone stuff here...
	}

	Songbird.createRoom = function (context, options) {
	  return new Room(context, options);
	}
	Songbird.createLateReflections = function (context, options) {
	  return new LateReflections(context, options);
	}
	Songbird.createEarlyReflections = function (context, options) {
	  return new EarlyReflections(context, options);
	}

	// var Songbird = {};

	// /**
	//  * Create {@link Listener Listener} to listen to
	//  * sources in a configurable environment.
	//  * @param {AudioContext} context
	//  * Associated {@link
	// https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
	//  * @param {Number} options.ambisonicOrder
	//  * Desired ambisonic order.
	//  * @param {Map} options.dimensions
	//  * Dimensions map which should conform to the layout of
	//  * {@link Room.DefaultDimensions Room.DefaultDimensions}
	//  * @param {Map} options.materials
	//  * Materials map which should conform to the layout of
	//  * {@link Room.DefaultMaterials Room.DefaultMaterials}
	//  * @param {Number} options.speedOfSound
	//  * (in meters / second).
	//  * @returns {Listener}
	//  */
	// Songbird.createListener = function (context, options) {
	//   return new Listener(context, options);
	// }

	// /**
	//  * Create {@link Source Source} to spatialize an audio buffer.
	//  * @param {Listener} listener Associated Listener.
	//  * @param {Object} options
	//  * @param {Number} options.minDistance Min. distance (in meters).
	//  * @param {Number} options.maxDistance Max. distance (in meters).
	//  * @param {Number} options.gain Gain (linear).
	//  * @param {Float32Array} options.position Position [x,y,z] (in meters).
	//  * @param {Float32Array} options.velocity Velocity [x,y,z] (in meters).
	//  * @param {Float32Array} options.orientation Orientation [x,y,z] (in meters).
	//  * @returns {Source}
	//  */
	// Songbird.createSource = function (listener, options) {
	//   return new Source(listener, options);
	// }

	// /**
	//  * Create {@link Encoder Encoder} to spatially encodes input
	//  * using spherical harmonics.
	//  * @param {AudioContext} context
	//  * Associated {@link
	// https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
	//  * @param {Number} ambisonicOrder
	//  * Desired ambisonic Order. Defaults to
	//  * {@link Globals.DEFAULT_AMBISONIC_ORDER Globals.DEFAULT_AMBISONIC_ORDER}.
	//  * @returns {Encoder}
	//  */
	// Songbird.createEncoder = function (context, ambisonicOrder) {
	//   return new Encoder(context, ambisonicOrder);
	// }

	// /**
	//  * Create {@link Attenuation Attenuation} to apply distance attenuation.
	//  * @param {AudioContext} context
	//  * Associated {@link
	// https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
	//  * @param {Object} options
	//  * @param {Number} options.minDistance Min. distance (in meters).
	//  * @param {Number} options.maxDistance Max. distance (in meters).
	//  * @param {string} options.rolloffModel
	//  * Rolloff model to use, chosen from options in
	//  * {@link Globals.ROLLOFF_MODELS Globals.ROLLOFF_MODELS}.
	//  * @return {Attenuation}
	//  */
	// Songbird.createAttenuation = function (context, options) {
	//   return new Attenuation(context, options);
	// }

	module.exports = Songbird;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

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
	 * @file Pre-defined wall materials, mathematical constants and utility
	 * functions for computing room acoustics.
	 * @author Andrew Allen <bitllama@google.com>
	 */

	'use strict';

	// Internal dependencies.
	var Global = __webpack_require__(3);
	var Utils = __webpack_require__(4);
	var LateReflections = __webpack_require__(5);
	var EarlyReflections = __webpack_require__(6);

	/**
	 * @class Room
	 * @description Model that manages early and late reflections using acoustic
	 * properties and listener position relative to a rectangular room.
	 * @param {AudioContext} context
	 * Associated {@link
	https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
	 * @param {Object} options
	 * @param {Number} options.speedOfSound
	 * (in meters/second). Defaults to
	 * {@link SPEED_OF_SOUND SPEED_OF_SOUND}.
	 * @param {Object} options.dimensions (in meters). Defaults to
	 * {@link EarlyReflections.DEFAULT_DIMENSIONS DEFAULT_DIMENSIONS}.
	 * @param {Object} options.materials Named acoustic materials per wall.
	 * Defaults to {@link Room.DEFAULT_MATERIALS DEFAULT_MATERIALS}.
	 * @param {Float32Array} options.listenerPosition
	 * The initial listener position (in meters). Defaults to
	 * {@link DEFAULT_POSITION DEFAULT_POSITION}.
	 */
	function Room (context, options) {
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
	   * Output {@link
	   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
	   * @member {AudioNode} output
	   * @memberof Room
	   * @instance
	   */

	  // Sanitize inputs.
	  if (options == undefined) {
	    options = {};
	  }
	  if (options.speedOfSound == undefined) {
	    options.speedOfSound = Global.SPEED_OF_SOUND;
	  }
	  this.speedOfSound = options.speedOfSound;
	  options.dimensions = _sanitizeDimensions(options.dimensions);
	  var absorptionCoefficients = _getCoefficientsFromMaterials(options.materials);
	  var durations = _getDurationsFromProperties(options.dimensions,
	    absorptionCoefficients, options.speedOfSound);
	  var reflectionCoefficients =
	    _computeReflectionCoefficients(absorptionCoefficients);

	  // Construct submodules for early and late reflections.
	  this.early = new EarlyReflections(context, {
	    dimensions : options.dimensions,
	    coefficients : reflectionCoefficients,
	    speedOfSound : options.speedOfSound,
	    listenerPosition : options.listenerPosition
	  });
	  this.late = new LateReflections(context, {
	    durations : durations
	  });

	  // Construct auxillary audio nodes.
	  this.output = context.createGain();
	  this._merger = context.createChannelMerger(4);

	  this.early.output.connect(this.output);
	  this.late.output.connect(this._merger, 0, 0);
	  this._merger.connect(this.output);
	}

	/**
	 * Set the room's dimensions and wall materials.
	 * @param {Object} dimensions (in meters). Defaults to
	 * {@link EarlyReflections.DEFAULT_DIMENSIONS DEFAULT_DIMENSIONS}.
	 * @param {Object} materials Named acoustic materials per wall. Defaults to
	 * {@link Room.DEFAULT_MATERIALS DEFAULT_MATERIALS}.
	 */
	Room.prototype.setProperties = function (dimensions, materials) {
	  // Compute late response.
	  absorptionCoefficients = _getCoefficientsFromMaterials(materials);
	  durations = _getDurationsFromProperties(dimensions, absorptionCoefficients,
	    this.speedOfSound);
	  this.late.setDurations(durations);

	  // Compute early response.
	  this.early.speedOfSound = this.speedOfSound;
	  var reflectionCoefficients =
	    _computeReflectionCoefficients(absorptionCoefficients);
	  this.early.setRoomProperties(dimensions, reflectionCoefficients);
	}

	/**
	 * Set the listener's position (in meters),
	 * where [0,0,0] is the center of the room.
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 */
	Room.prototype.setListenerPosition = function (x, y, z) {
	  //TODO(bitllama): Check distance and zero-out if outside of room.
	  this.early.speedOfSound = this.speedOfSound;
	  this.early.setListenerPosition(x, y, z);
	}

	/** @type {Number} */
	Room.MIN_VOLUME = 1e-4;
	/** @type {Float32Array} */
	Room.AIR_ABSORPTION_COEFFICIENTS =
	  [0.0006, 0.0006, 0.0007, 0.0008, 0.0010, 0.0015, 0.0026, 0.0060, 0.0207];
	/** @type {Number} */
	Room.EYRING_CORRECTION = 1.38;

	/**
	 * Default materials use strings from
	 * {@link MATERIAL_COEFFICIENTS MATERIAL_COEFFICIENTS}
	 * @type {Object}
	 */
	Room.DEFAULT_MATERIALS = {
	  left : 'transparent', right : 'transparent', front : 'transparent',
	  back : 'transparent', down : 'transparent', up : 'transparent'
	};

	/**
	 * Pre-defined frequency-dependent absorption coefficients for listed materials.
	 * Currently supported materials are:
	 * 'transparent',
	 * 'acoustic-ceiling-tiles',
	 * 'brick-bare',
	 * 'brick-painted',
	 * 'concrete-block-coarse',
	 * 'concrete-block-painted',
	 * 'curtain-heavy',
	 * 'fiber-glass-insulation',
	 * 'glass-thin',
	 * 'glass-thick',
	 * 'grass',
	 * 'linoleum-on-concrete',
	 * 'marble',
	 * 'metal',
	 * 'parquet-on-concrete',
	 * 'plaster-smooth',
	 * 'plywood-panel',
	 * 'polished-concrete-or-tile',
	 * 'sheetrock',
	 * 'water-or-ice-surface',
	 * 'wood-ceiling',
	 * 'wood-panel',
	 * 'uniform'
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

	/** @type {Number} */
	Room.STARTING_BAND = 4;
	/** @type {Number} */
	Room.NUMBER_AVERAGING_BANDS = 3;

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
	  var durations = new Float32Array(Global.NUMBER_REVERB_BANDS);

	  // Sanitize inputs.
	  dimensions = _sanitizeDimensions(dimensions);
	  coefficients = _sanitizeCoefficients(coefficients);
	  if (speedOfSound == undefined) {
	    speedOfSound = Globals.SPEED_OF_SOUND;
	  }

	  // Acoustic constant.
	  var k = Global.TWENTY_FOUR_LOG10 / speedOfSound;

	  // Compute volume, skip if room is not present.
	  var volume = dimensions.width * dimensions.height * dimensions.depth;
	  if (volume < Room.MIN_VOLUME) {
	    return durations;
	  }

	  // Room surface area.
	  var leftRightArea = dimensions.width * dimensions.height;
	  var floorCeilingArea = dimensions.width * dimensions.depth;
	  var frontBackArea = dimensions.depth * dimensions.height;
	  var totalArea = 2 * (leftRightArea + floorCeilingArea + frontBackArea);
	  for (var i = 0; i < Global.NUMBER_REVERB_BANDS; i++) {
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
	  var reflectionCoefficients = EarlyReflections.DEFAULT_REFLECTION_COEFFICIENTS;
	  for (var property in EarlyReflections.DEFAULT_REFLECTION_COEFFICIENTS) {
	    // Compute average absorption coefficient (per wall).
	    for (var j = 0; j < Room.NUMBER_AVERAGING_BANDS; j++) {
	      var bandIndex = j + Room.STARTING_BAND;
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


/***/ }),
/* 3 */
/***/ (function(module, exports) {

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
	 * @file Mathematical constants and default values for submodules.
	 * @author Andrew Allen <bitllama@google.com>
	 */

	'use strict';

	// Math constants.
	/** @type {Number} */
	exports.TWO_PI = 6.28318530717959;
	/** @type {Number} */
	exports.TWENTY_FOUR_LOG10 = 55.2620422318571;
	/** @type {Number} */
	exports.LOG1000 = 6.90775527898214;
	/** @type {Number} */
	exports.LOG2_DIV2 = 0.346573590279973;
	/** @type {Number} */
	exports.DEGREES_TO_RADIANS = 0.017453292519943;
	/** @type {Number} */
	exports.RADIANS_TO_DEGREES = 57.295779513082323;
	/** @type {Number} */
	exports.EPSILON_FLOAT = 1e-6;
	/** @type {Number} */
	exports.DEFAULT_GAIN_LINEAR = 1;
	/** @type {Float32Array} */
	exports.DEFAULT_POSITION = [0, 0, 0];
	/** @type {Float32Array} */
	exports.DEFAULT_ORIENTATION = [0, 0, 0];
	/** @type {Float32Array} */
	exports.DEFAULT_FORWARD = [0, 0, 1];
	/** @type {Float32Array} */
	exports.DEFAULT_UP = [0, 1, 0];
	/** @type {Float32Array} */
	exports.DEFAULT_RIGHT = [1, 0, 0];
	/** @type {Number} */
	exports.DEFAULT_AMBISONIC_ORDER = 1;
	/** @type {Number} */
	exports.SPEED_OF_SOUND = 343;

	// Reverb constants and defaults.
	/** @type {Number} */
	exports.NUMBER_REVERB_BANDS = 9;



/***/ }),
/* 4 */
/***/ (function(module, exports) {

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
	 * @file Songbird library common utilities.
	 * @author Andrew Allen <bitllama@google.com>
	 */

	'use strict';

	/**
	 * Songbird library logging function.
	 * @type {Function}
	 * @param {any} Message to be printed out.
	 */
	exports.log = function () {
	  window.console.log.apply(window.console, [
	    '%c[Songbird]%c '
	      + Array.prototype.slice.call(arguments).join(' ') + ' %c(@'
	      + performance.now().toFixed(2) + 'ms)',
	    'background: #BBDEFB; color: #FF5722; font-weight: 700',
	    'font-weight: 400',
	    'color: #AAA'
	  ]);
	};

	/**
	 * Quaternion constructor.
	 * @type {Function}
	 * @param {Number} roll (in radians).
	 * @param {Number} pitch (in radians).
	 * @param {Number} yaw (in radians).
	 * @returns {Float32Array} 4-element vector.
	 */
	exports.toQuaternion = function (roll, pitch, yaw) {
	  var t0 = Math.cos(yaw * 0.5);
	  var t1 = Math.sin(yaw * 0.5);
	  var t2 = Math.cos(roll * 0.5);
	  var t3 = Math.sin(roll * 0.5);
	  var t4 = Math.cos(pitch * 0.5);
	  var t5 = Math.sin(pitch * 0.5);
	  return [
	    t0 * t2 * t4 + t1 * t3 * t5,
	    t0 * t3 * t4 - t1 * t2 * t5,
	    t0 * t2 * t5 + t1 * t3 * t4,
	    t1 * t2 * t4 - t0 * t3 * t5
	  ];
	}

	/**
	 * Hamilton product of two quaternions.
	 * @param {Float32Array} q1 4-element vector.
	 * @param {Float32Array} q2 4-element vector.
	 * @returns {Float32Array} 4-element vector.
	 */
	exports.hamiltonProduct = function (q1, q2) {
	  return [
	    q1[0] * q2[0] - q1[1] * q2[1] - q1[2] * q2[2] - q1[3] * q2[3],
	    q1[0] * q2[1] + q1[1] * q2[0] + q1[2] * q2[3] - q1[3] * q2[2],
	    q1[0] * q2[2] - q1[1] * q2[3] + q1[2] * q2[0] + q1[3] * q2[1],
	    q1[0] * q2[3] + q1[1] * q2[2] - q1[2] * q2[1] + q1[3] * q2[0]
	  ];
	}

	/**
	 * Rotate a 3-d vector using a quaternion.
	 * @param {Float32Array} p 3-element vector.
	 * @param {Float32Array} q 4-element vector.
	 * @returns {Float32Array} 3-element vector.
	 */
	exports.rotateVector = function (p, q) {
	  var p_n = exports.hamiltonProduct(
	    exports.hamiltonProduct(q, [0, p[0], p[1], p[2]]),
	      [q[0], -q[1], -q[2], -q[3]]
	  );
	  return [p_n[1], p_n[2], p_n[3]];
	}

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

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
	 * @file Late reverberation filter for Ambisonic content.
	 * @author Andrew Allen <bitllama@google.com>
	 */

	'use strict';

	// Internal dependencies.
	var Global = __webpack_require__(3);
	var Utils = __webpack_require__(4);

	/**
	 * @class LateReflections
	 * @description Late-reflections reverberation filter for Ambisonic content.
	 * @param {AudioContext} context
	 * Associated {@link
	https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
	 * @param {Object} options
	 * @param {Array} options.durations
	 * Multiband RT60 durations (in seconds) for each frequency band, listed as
	 * {@link REVERB_BANDS REVERB_BANDS}. Defaults to
	 * {@link LateReflections.DEFAULT_DURATIONS DEFAULT_DURATIONS}.
	 * @param {Number} options.predelay Pre-delay (in milliseconds). Defaults to
	 * {@link LateReflections.PREDELAY_MS PREDELAY_MS}.
	 * @param {Number} options.gain Output gain (linear). Defaults to
	 * {@link LateReflections.DEFAULT_GAIN DEFAULT_GAIN}.
	 * @param {Number} options.bandwidth Bandwidth (in octaves) for each frequency
	 * band. Defaults to {@link LateReflections.BANDWIDTH BANDWIDTH}.
	 * @param {Number} options.tailonset Length (in milliseconds) of impulse
	 * response to apply a half-Hann window. Defaults to
	 * {@link LateReflections.TAIL_ONSET_MS TAIL_ONSET_MS}.
	 */
	function LateReflections (context, options) {
	  // Public variables.
	  /**
	   * Input {@link
	   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
	   * @member {AudioNode} input
	   * @memberof LateReflections
	   * @instance
	   */
	  /**
	   * Output {@link
	   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
	   * @member {AudioNode} output
	   * @memberof LateReflections
	   * @instance
	   */

	  this._context = context;

	  // Use defaults for undefined arguments
	  if (options == undefined) {
	    options = {};
	  }
	  if (options.durations == undefined) {
	    options.durations = LateReflections.DEFAULT_DURATIONS;
	  }
	  if (options.predelay == undefined) {
	    options.predelay = LateReflections.PREDELAY_MS;
	  }
	  if (options.gain == undefined) {
	    options.gain = LateReflections.DEFAULT_GAIN;
	  }
	  if (options.bandwidth == undefined) {
	    options.bandwidth = LateReflections.BANDWIDTH;
	  }
	  if (options.tailonset == undefined) {
	    options.tailonset = LateReflections.TAIL_ONSET_MS;
	  }

	  // Assign pre-computed variables.
	  var delaySecs = options.predelay / 1000;
	  this._bandwidthCoeff = options.bandwidth * Global.LOG2_DIV2;
	  this._tailonsetSamples = options.tailonset / 1000;

	  // Create nodes.
	  this.input = context.createGain();
	  this._predelay = context.createDelay(delaySecs);
	  this._convolver = context.createConvolver();
	  this.output = context.createGain();

	  // Set reverb attenuation.
	  this.output.gain.value = options.gain;

	  // Disable normalization.
	  this._convolver.normalize = false;

	  // Connect nodes.
	  this.input.connect(this._predelay);
	  this._predelay.connect(this._convolver);
	  this._convolver.connect(this.output);

	  // Compute IR using RT60 values.
	  this.setDurations(options.durations);
	}

	/**
	 * Re-compute a new impulse response by providing Multiband RT60 durations.
	 * @param {Array} durations
	 * Multiband RT60 durations (in seconds) for each frequency band, listed as
	 * {@link REVERB_BANDS REVERB_BANDS}.
	 */
	LateReflections.prototype.setDurations = function (durations) {
	  if (durations.length !== Global.NUMBER_REVERB_BANDS) {
	    Utils.log("Warning: invalid number of RT60 values provided to reverb.");
	    return;
	  }

	  // Compute impulse response.
	  var durationsSamples = new Float32Array(Global.NUMBER_REVERB_BANDS);
	  var sampleRate = this._context.sampleRate;

	  for (var i = 0; i < durations.length; i++) {
	    // Clamp within suitable range.
	    durations[i] =
	      Math.max(0, Math.min(LateReflections.MAX_DURATION, durations[i]));

	    // Convert seconds to samples.
	    durationsSamples[i] = Math.round(durations[i] * sampleRate *
	      LateReflections.DURATION_MULTIPLIER);
	  };

	  // Determine max RT60 length in samples.
	  var durationsSamplesMax = 0;
	  for (var i = 0; i < durationsSamples.length; i++) {
	    if (durationsSamples[i] > durationsSamplesMax) {
	      durationsSamplesMax = durationsSamples[i];
	    }
	  }

	  // Skip this step if there is no reverberation to compute.
	  if (durationsSamplesMax < 1) {
	    durationsSamplesMax = 1;
	  }

	  // Create impulse response buffer.
	  var buffer = this._context.createBuffer(1, durationsSamplesMax, sampleRate);
	  var bufferData = buffer.getChannelData(0);

	  // Create noise signal (computed once, referenced in each band's routine).
	  var noiseSignal = new Float32Array(durationsSamplesMax);
	  for (var i = 0; i < durationsSamplesMax; i++) {
	    noiseSignal[i] = Math.random() * 2 - 1;
	  }

	  // Compute the decay rate per-band and filter the decaying noise signal.
	  for (var i = 0; i < Global.NUMBER_REVERB_BANDS; i++) {
	  //for (var i = 0; i < 1; i++) {
	    // Compute decay rate.
	    //TODO(bitllama): Remove global usage.
	    var decayRate = -Global.LOG1000 / durationsSamples[i];

	    // Construct a standard one-zero, two-pole bandpass filter:
	    // H(z) = (b0 * z^0 + b1 * z^-1 + b2 * z^-2) / (1 + a1 * z^-1 + a2 * z^-2)
	    var omega = Global.TWO_PI * LateReflections.REVERB_BANDS[i] / sampleRate;
	    var sinOmega = Math.sin(omega);
	    var alpha = sinOmega * Math.sinh(this._bandwidthCoeff * omega / sinOmega);
	    var a0CoeffReciprocal = 1 / (1 + alpha);
	    var b0Coeff = alpha * a0CoeffReciprocal;
	    var a1Coeff = -2 * Math.cos(omega) * a0CoeffReciprocal;
	    var a2Coeff = (1 - alpha) * a0CoeffReciprocal;

	    // We optimize since b2 = -b0, b1 = 0.
	    // Update equation for two-pole bandpass filter:
	    //   u[n] = x[n] - a1 * x[n-1] - a2 * x[n-2]
	    //   y[n] = b0 * (u[n] - u[n-2])
	    var um1 = 0;
	    var um2 = 0;
	    for (var j = 0; j < durationsSamples[i]; j++) {
	      // Exponentially-decaying white noise.
	      var x = noiseSignal[j] * Math.exp(decayRate * j);

	      // Filter signal with bandpass filter and add to output.
	      var u = x - a1Coeff * um1 - a2Coeff * um2;
	      bufferData[j] += b0Coeff * (u - um2);

	      // Update coefficients.
	      um2 = um1;
	      um1 = u;
	    }
	  }

	  // Create and apply half of a Hann window to the beginning of the IR.
	  var halfHannLength =
	    Math.round(this._tailonsetSamples);
	  for (var i = 0; i < Math.min(bufferData.length, halfHannLength); i++) {
	    var halfHann =
	      0.5 * (1 - Math.cos(Global.TWO_PI * i / (2 * halfHannLength - 1)));
	      bufferData[i] *= halfHann;
	  }
	  this._convolver.buffer = buffer;
	}

	/** The default bandwidth (in octaves) of the center frequencies.
	 * @type {Number}
	 */
	LateReflections.BANDWIDTH = 1;
	/** The default multiplier applied when computing tail lengths.
	 * @type {Number}
	 */
	LateReflections.DURATION_MULTIPLIER = 1;
	/** @type {Number} */
	LateReflections.PREDELAY_MS = 1.5;
	/** @type {Number} */
	LateReflections.TAIL_ONSET_MS = 3.8;
	/** @type {Number} */
	LateReflections.DEFAULT_GAIN = 0.01;
	/** @type {Number} */
	LateReflections.MAX_DURATION = 3;
	/**
	 * Center frequencies of the multiband reverberation engine.
	 * Nine bands are computed by: 31.25 * 2^(0:8).
	 * @type {Array}
	 */
	LateReflections.REVERB_BANDS = [
	  31.25, 62.5, 125, 250, 500, 1000, 2000, 4000, 8000
	];
	/** @type {Float32Array} */
	LateReflections.DEFAULT_DURATIONS =
	  new Float32Array(LateReflections.REVERB_BANDS.length);

	module.exports = LateReflections;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

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
	 * @file Ray-tracing-based early reflections model.
	 * @author Andrew Allen <bitllama@google.com>
	 */

	'use strict';

	// Internal dependencies.
	var Global = __webpack_require__(3);

	/**
	 * @class EarlyReflections
	 * @description Ray-tracing-based early reflections model.
	 * @param {AudioContext} context
	 * Associated {@link
	https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
	 * @param {Object} options
	 * @param {Object} options.dimensions
	 * Room dimensions (in meters). Defaults to
	 * {@link EarlyReflections.DEFAULT_DIMENSIONS DEFAULT_DIMENSIONS}.
	 * @param {Object} options.coefficients
	 * Multiband reflection coefficients per wall. Defaults to
	 * {@link EarlyReflections.DEFAULT_REFLECTION_COEFFICIENTS
	 * DEFAULT_REFLECTION_COEFFICIENTS}.
	 * @param {Number} options.speedOfSound
	 * (in meters / second). Defaults to {@link SPEED_OF_SOUND SPEED_OF_SOUND}.
	 * @param {Float32Array} options.listenerPosition
	 * (in meters). Defaults to
	 * {@link DEFAULT_POSITION DEFAULT_POSITION}.
	 */
	function EarlyReflections (context, options) {
	  // Public variables.
	  /**
	   * The room's speed of sound (in meters/second).
	   * @member {Number} speedOfSound
	   * @memberof EarlyReflections
	   * @instance
	   */
	  /**
	   * Input {@link
	   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
	   * @member {AudioNode} input
	   * @memberof EarlyReflections
	   * @instance
	   */
	  /**
	   * Output {@link
	   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
	   * @member {AudioNode} output
	   * @memberof EarlyReflections
	   * @instance
	   */

	  // Assign defaults for undefined options.
	  if (options == undefined) {
	    options = {};
	  }
	  if (options.speedOfSound == undefined) {
	    options.speedOfSound = Global.SPEED_OF_SOUND;
	  }
	  if (options.listenerPosition == undefined) {
	    options.listenerPosition = Global.DEFAULT_POSITION;
	  }
	  if (options.coefficients == undefined) {
	    options.coefficients = EarlyReflections.DEFAULT_REFLECTION_COEFFICIENTS;
	  }

	  this.speedOfSound = options.speedOfSound;

	  // Create nodes.
	  this.input = context.createGain();
	  this.output = context.createGain();
	  this._lowpass = context.createBiquadFilter();
	  this._delays = {};
	  this._gains = {}; // ReflectionCoeff / Attenuation
	  this._inverters = {};
	  this._merger = context.createChannelMerger(4); // First-order encoding only.

	  // Connect audio graph for each wall reflection.
	  for (var property in EarlyReflections.DEFAULT_REFLECTION_COEFFICIENTS) {
	    this._delays[property] = context.createDelay(EarlyReflections.MAX_DURATION);
	    this._gains[property] = context.createGain();
	  }
	  this._inverters.right = context.createGain();
	  this._inverters.down = context.createGain();
	  this._inverters.back = context.createGain();

	  // Initialize lowpass filter.
	  this._lowpass.type = 'lowpass';
	  this._lowpass.frequency.value = EarlyReflections.CUTOFF_FREQUENCY;
	  this._lowpass.Q.value = 0;

	  // Initialize encoder directions, set delay times and gains to 0.
	  for (var property in EarlyReflections.DEFAULT_REFLECTION_COEFFICIENTS) {
	    this._delays[property].delayTime.value = 0;
	    this._gains[property].gain.value = 0;
	  }

	  // Initialize inverters for opposite walls ('right', 'down', 'back' only).
	  this._inverters.right.gain.value = -1;
	  this._inverters.down.gain.value = -1;
	  this._inverters.back.gain.value = -1;

	  // Connect nodes.
	  this.input.connect(this._lowpass);
	  for (var property in EarlyReflections.DEFAULT_REFLECTION_COEFFICIENTS) {
	    this._lowpass.connect(this._delays[property]);
	    this._delays[property].connect(this._gains[property]);
	    this._gains[property].connect(this._merger, 0, 0);
	  }

	  // Connect gains to ambisonic channel output.
	  this._gains.left.connect(this._merger, 0, 1);     // Left: [1 1 0 0]

	  this._gains.right.connect(this._inverters.right); // Right: [1 -1 0 0]
	  this._inverters.right.connect(this._merger, 0, 1);

	  this._gains.up.connect(this._merger, 0, 2);       // Up: [1 0 1 0]

	  this._gains.down.connect(this._inverters.down);   // Down: [1 0 -1 0]
	  this._inverters.down.connect(this._merger, 0, 2);

	  this._gains.front.connect(this._merger, 0, 3);    // Front: [1 0 0 1]

	  this._gains.back.connect(this._inverters.back);   // Back: [1 0 0 -1]
	  this._inverters.back.connect(this._merger, 0, 3);
	  this._merger.connect(this.output);

	  // Initialize.
	  this._listenerPosition = options.listenerPosition;
	  this.setRoomProperties(options.dimensions, options.coefficients);
	}

	/**
	 * Set the listener's position (in meters),
	 * where [0,0,0] is the center of the room.
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 */
	EarlyReflections.prototype.setListenerPosition = function (x, y, z) {
	  // Assign listener position.
	  this._listenerPosition = [x, y, z];

	  // Determine distances to each wall.
	  var distances = {
	    left : this._halfDimensions.width + x + EarlyReflections.MIN_DISTANCE,
	    right : this._halfDimensions.width - x + EarlyReflections.MIN_DISTANCE,
	    front : this._halfDimensions.depth + z + EarlyReflections.MIN_DISTANCE,
	    back : this._halfDimensions.depth - z + EarlyReflections.MIN_DISTANCE,
	    down : this._halfDimensions.height + y + EarlyReflections.MIN_DISTANCE,
	    up : this._halfDimensions.height - y + EarlyReflections.MIN_DISTANCE,
	  };

	  // Assign delay & attenuation values using distances.
	  for (var property in EarlyReflections.DEFAULT_REFLECTION_COEFFICIENTS) {
	    // Compute and assign delay (in seconds).
	    var delayInSecs = distances[property] / this.speedOfSound;
	    this._delays[property].delayTime.value = delayInSecs;

	    // Compute and assign gain, uses logarithmic rolloff: "g = R / (d + 1)"
	    var attenuation = this._coefficients[property] / distances[property];
	    this._gains[property].gain.value = attenuation;
	  }
	}

	/**
	 * Set the room's properties which determines the characteristics of reflections.
	 * @param {Object} dimensions
	 * Room dimensions (in meters). Defaults to
	 * {@link EarlyReflections.DEFAULT_DIMENSIONS DEFAULT_DIMENSIONS}.
	 * @param {Object} coefficients
	 * Multiband reflection coeffs per wall. Defaults to
	 * {@link EarlyReflections.DEFAULT_REFLECTION_COEFFICIENTS
	 * DEFAULT_REFLECTION_COEFFICIENTS}.
	 */
	EarlyReflections.prototype.setRoomProperties = function (dimensions,
	                                                         coefficients) {
	  if (dimensions == undefined) {
	    dimensions = EarlyReflections.DEFAULT_DIMENSIONS;
	  }
	  if (coefficients == undefined) {
	    coefficients = EarlyReflections.DEFAULT_REFLECTION_COEFFICIENTS;
	  }
	  this._coefficients = coefficients;

	  // Sanitize dimensions and store half-dimensions.
	  this._halfDimensions = {};
	  this._halfDimensions.width = dimensions.width * 0.5;
	  this._halfDimensions.height = dimensions.height * 0.5;
	  this._halfDimensions.depth = dimensions.depth * 0.5;

	  // Update listener position with new room properties.
	  this.setListenerPosition(this._listenerPosition[0],
	    this._listenerPosition[1], this._listenerPosition[2]);
	}

	/** @type {Number} */
	EarlyReflections.MAX_DURATION = 0.5;
	/** @type {Number} */
	EarlyReflections.CUTOFF_FREQUENCY = 6400; // Uses -12dB cutoff.
	/** @type {Object} */
	EarlyReflections.DEFAULT_REFLECTION_COEFFICIENTS = {
	  left : 0, right : 0, front : 0, back : 0, down : 0, up : 0
	};
	/** @type {Number} */
	EarlyReflections.MIN_DISTANCE = 1;
	/**
	 * Default dimensions (in meters).
	 * @type {Object}
	 */
	EarlyReflections.DEFAULT_DIMENSIONS = {
	  width : 0, height : 0, depth : 0
	};

	module.exports = EarlyReflections;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

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
	 * @file Source model to spatialize an audio buffer.
	 * @author Andrew Allen <bitllama@google.com>
	 */

	'use strict';

	// Internal dependencies.
	var Attenuation = __webpack_require__(8);
	var Encoder = __webpack_require__(9);
	var Global = __webpack_require__(3);
	var Utils = __webpack_require__(4);

	/**
	 * @class Source
	 * @description Source model to spatialize an audio buffer.
	 * @param {Listener} listener Associated Listener.
	 * @param {Object} options
	 * @param {Number} options.minDistance Min. distance (in meters).
	 * @param {Number} options.maxDistance Max. distance (in meters).
	 * @param {Number} options.gain Gain (linear).
	 * @param {Float32Array} options.position
	 * Position [x,y,z] (in meters).
	 * @param {Float32Array} options.orientation
	 * Orientation [roll, pitch, yaw] (in radians).
	 * @param {string} options.rolloff
	 */
	function Source (listener, options) {
	  // Public variables.
	  /**
	   * Input to .connect() input AudioNodes to.
	   * @member {AudioNode} input
	   * @memberof Source
	   */

	  // Assign defaults for undefined options.
	  if (options == undefined) {
	    options = new Object();
	  }
	  if (options.gain == undefined) {
	    options.gain = Global.DEFAULT_GAIN_LINEAR;
	  }
	  if (options.position == undefined) {
	    options.position = Global.DEFAULT_POSITION;
	  }
	  if (options.orientation == undefined) {
	    options.orientation = Global.DEFAULT_ORIENTATION;
	  }
	  if (options.rolloff == undefined) {
	    options.rolloff = Attenuation.DEFAULT_ROLLOFF_MODEL;
	  }

	  this._listener = listener;
	  this._position = new Float32Array(3);
	  this._forward = new Float32Array(3);
	  this._up = new Float32Array(3);
	  this._right = new Float32Array(3);
	  this._directivity_alpha = 0;
	  this._directivity_order = 1;

	  // Create nodes.
	  var context = listener._context;
	  this.input = context.createGain();
	  this._directivity = context.createBiquadFilter();
	  this._toEarly = context.createGain();
	  this._toLate = context.createGain();
	  this._attenuation =
	    new Attenuation(context, options);
	  this._encoder =
	    new Encoder(context, listener._ambisonicOrder);

	  // Initialize Directivity filter.
	  this._directivity.type = 'lowpass';
	  this._directivity.Q.value = 0;
	  this._directivity.frequency.value = listener._context.sampleRate * 0.5;

	  // Connect nodes.
	  this.input.connect(this._toLate);
	  this._toLate.connect(listener._room.late.input);

	  this.input.connect(this._attenuation.input);
	  this._attenuation.output.connect(this._toEarly);
	  this._toEarly.connect(listener._room.early.input);

	  this._attenuation.output.connect(this._directivity);
	  this._directivity.connect(this._encoder.input);
	  this._encoder.output.connect(listener.output);

	  // Assign initial conditions.
	  this.setPosition(options.position[0], options.position[1],
	    options.position[2]);
	  this.setOrientation(options.orientation[0], options.orientation[1],
	    options.orientation[2]);
	  this.input.gain.value = options.gain;
	}

	/**
	 * Set source's position (in meters).
	 * @param {Number} x
	 * @param {Number} y
	 * @param {Number} z
	 */
	Source.prototype.setPosition = function (x, y, z) {
	  var dx = new Float32Array(3);

	  // Assign new position.
	  this._position[0] = x;
	  this._position[1] = y;
	  this._position[2] = z;
	  this._computeDistanceOutsideRoom();

	  // Compute distance to listener.
	  for (var i = 0; i < 3; i++) {
	    dx[i] = this._position[i] - this._listener._position[i];
	  }
	  var distance = Math.sqrt(dx[0] * dx[0] + dx[1] * dx[1] + dx[2] * dx[2]);

	  // Normalize direction vector.
	  dx[0] /= distance;
	  dx[1] /= distance;
	  dx[2] /= distance;

	  // Compute directivity pattern.
	  this._computeDirectivity(dx);

	  // Compuete angle of direction vector.
	  var azimuth = Math.atan2(-dx[0], dx[2]) * Global.RADIANS_TO_DEGREES;
	  var elevation = Math.atan2(dx[1],
	    Math.sqrt(dx[0] * dx[0] + dx[2] * dx[2])) * Global.RADIANS_TO_DEGREES;

	  // Set distance/direction values.
	  this._attenuation.setDistance(distance);
	  this._encoder.setDirection(azimuth, elevation);
	}

	/**
	 * Set source's angle relative to the listener's position.
	 * Azimuth is counterclockwise (0-360). Elevation range is 90 to -90.
	 * @param {Number} azimuth (in degrees).
	 * @param {Number} elevation (in degrees) [defaults to 0].
	 * @param {Number} distance (in meters) [defaults to 1].
	 */
	Source.prototype.setAngleFromListener = function (azimuth, elevation,
	                                                  distance) {
	  if (azimuth == undefined) {
	    azimuth = Attenuation.DEFAULT_AZIMUTH;
	  }
	  if (elevation == undefined) {
	    elevation = Attenuation.DEFAULT_ELEVATION;
	  }
	  if (distance == undefined) {
	    distance = Source.DEFAULT_DISTANCE;
	  }
	  var theta = azimuth * Global.DEGREES_TO_RADIANS;
	  var phi = elevation * Global.DEGREES_TO_RADIANS;

	  // Polar -> Cartesian (direction from listener).
	  var x = Math.sin(theta) * Math.cos(phi);
	  var y = Math.sin(phi);
	  var z = -Math.cos(theta) * Math.cos(phi);

	  // Compute directivity pattern.
	  this._computeDirectivity([x, y, z]);

	  // Assign new position based on relationship to listener.
	  this._position[0] = this._listener._position[0] + x;
	  this._position[1] = this._listener._position[1] + y;
	  this._position[2] = this._listener._position[2] + z;
	  this._computeDistanceOutsideRoom();

	  // Set distance/direction values.
	  this._attenuation.setDistance(distance);
	  this._encoder.setDirection(azimuth, elevation);
	}

	/**
	 * Set source's orientation (in radians).
	 * @param {Number} roll
	 * @param {Number} pitch
	 * @param {Number} yaw
	 */
	Source.prototype.setOrientation = function (roll, pitch, yaw) {
	  var q = Utils.toQuaternion(roll, pitch, yaw);
	  this._forward = Utils.rotateVector(Global.DEFAULT_FORWARD, q);
	  this._up = Utils.rotateVector(Global.DEFAULT_UP, q);
	  this._right = Utils.rotateVector(Global.DEFAULT_RIGHT, q);
	}

	Source.prototype.setSpread = function (spread) {
	}

	/**
	 * Set source's directivity pattern (defined by alpha), where 0 is an
	 * omnidirectional pattern, 1 is a bidirectional pattern, 0.5 is a cardiod
	 * pattern. The sharpness of the pattern is increased with order.
	 * @param {Number} alpha
	 * Determines directivity pattern (0 to 1).
	 * @param {Number} order
	 * Determines the steepness of the directivity pattern (1 to Inf).
	 */
	Source.prototype.setDirectivity = function (alpha, order) {
	  // Clamp between 0 and 1.
	  this._directivity_alpha = Math.min(1, Math.max(0, alpha));

	  if (order !== undefined) {
	    // Clamp between 1 and Inf.
	    this._directivity_order = Math.min(1, order);
	  }
	}

	// Compute directivity using standard microphone patterns.
	// Assign coeff to control a lowpass filter.
	Source.prototype._computeDirectivity = function (direction_to_listener) {
	  var coeff = 1.0;
	  if (this._directivity_alpha > Global.EPSILON_FLOAT) {
	    var cosTheta = this._forward[0] * direction_to_listener[0] +
	      this._forward[1] * direction_to_listener[1] +
	      this._forward[2] * direction_to_listener[2];
	    coeff = (1 - this._directivity_alpha) + this._directivity_alpha * cosTheta;
	    coeff = Math.pow(Math.abs(coeff), this._directivity_order);
	  }

	  // Apply low-pass filter.
	  this._directivity.frequency.value =
	    this._listener._context.sampleRate * 0.5 * coeff;
	}

	// Determine the distance a source is outside of a room. Attenuate gain going
	// to the reflections and reverb when the source is outside of the room.
	Source.prototype._computeDistanceOutsideRoom = function ()
	{
	  var dx = Math.max(0,
	    -this._listener._room.early._halfDimensions['width'] - this._position[0],
	    this._position[0] - this._listener._room.early._halfDimensions['width']);
	  var dy = Math.max(0,
	    -this._listener._room.early._halfDimensions['height'] - this._position[1],
	    this._position[1] - this._listener._room.early._halfDimensions['height']);
	  var dz = Math.max(0,
	    -this._listener._room.early._halfDimensions['depth'] - this._position[2],
	    this._position[2] - this._listener._room.early._halfDimensions['depth']);
	  var distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

	  // We apply a linear ramp from 1 to 0 as the source is up to 1m outside.
	  var gain = 1;
	  if (distance > Global.EPSILON_FLOAT) {
	    gain = Math.max(1, 1 - distance);
	  }
	  this._toLate.gain.value = gain;
	  this._toEarly.gain.value = gain;
	}

	/** @type {Number} */
	Source.DEFAULT_DISTANCE = 1;

	module.exports = Source;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

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
	 * @file Distance-based attenuation filter.
	 * @author Andrew Allen <bitllama@google.com>
	 */

	'use strict';

	// Internal dependencies.
	var Global = __webpack_require__(3);
	var Utils = __webpack_require__(4);

	/**
	 * @class Attenuation
	 * @description Distance-based attenuation filter.
	 * @param {AudioContext} context
	 * Associated {@link
	https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
	 * @param {Object} options
	 * @param {Number} options.minDistance
	 * Min. distance (in meters). Defaults to
	 * {@link Attenuation.MIN_DISTANCE MIN_DISTANCE}.
	 * @param {Number} options.maxDistance
	 * Max. distance (in meters). Defaults to
	 * {@link Attenuation.MAX_DISTANCE MAX_DISTANCE}.
	 * @param {string} options.rolloff
	 * Rolloff model to use, chosen from options in
	 * {@link Attenuation.ROLLOFFS ROLLOFFS}. Defaults to
	 * {@link Attenuation.DEFAULT_ROLLOFF DEFAULT_ROLLOFF}.
	 */
	function Attenuation (context, options) {
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
	   * Input {@link
	   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
	   * @member {AudioNode} input
	   * @memberof Attenuation
	   * @instance
	   */
	  /**
	   * Output {@link
	   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
	   * @member {AudioNode} output
	   * @memberof Attenuation
	   * @instance
	   */

	   // Use defaults for undefined arguments
	  if (options == undefined) {
	    options = new Object();
	  }
	  if (options.minDistance == undefined) {
	    options.minDistance = Attenuation.MIN_DISTANCE;
	  }
	  if (options.maxDistance == undefined) {
	    options.maxDistance = Attenuation.MAX_DISTANCE;
	  }
	  if (options.rolloff == undefined) {
	    options.rolloff = Attenuation.DEFAULT_ROLLOFF;
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
	Attenuation.prototype.setDistance = function (distance) {
	  var gain = 1;
	  if (this._rolloff == 'logarithmic') {
	    if (distance > this.maxDistance) {
	      gain = 0;
	    } else if (distance > this.minDistance) {
	      var range = this.maxDistance - this.minDistance;
	      if (range > Global.EPSILON_FLOAT) {
	        // Compute the distance attenuation value by the logarithmic curve
	        // "1 / (d + 1)" with an offset of |minDistance|.
	        var relativeDistance = distance - this.minDistance;
	        var attenuation = 1 / (relativeDistance + 1);
	        var attenuationMax = 1 / (range + 1);
	        gain = (attenuation - attenuationMax) / (1 - attenuationMax);
	      }
	    }
	  } else if (this._rolloff == 'linear') {
	    if (distance > this.maxDistance) {
	      gain = 0;
	    } else if (distance > this.minDistance) {
	      var range = this.maxDistance - this.minDistance;
	      if (range > Global.EPSILON_FLOAT) {
	        gain = (this.maxDistance - distance) / range;
	      }
	    }
	  }
	  this._gainNode.gain.value = gain;
	}

	/**
	 * Set rolloff.
	 * @param {string} rolloff
	 * Rolloff model to use, chosen from options in
	 * {@link Attenuation.ROLLOFFS ROLLOFFS}. Defaults to
	 * {@link Attenuation.DEFAULT_ROLLOFF DEFAULT_ROLLOFF}.
	 */
	Attenuation.prototype.setRolloff = function (rolloff) {
	  var isValidModel = ~Attenuation.ROLLOFFS.indexOf(rolloff);
	  if (rolloff == undefined || !isValidModel) {
	    if (!isValidModel) {
	      Utils.log('Invalid rolloff model (\"' + rolloff +
	        '\"). Using default: \"' + Attenuation.DEFAULT_ROLLOFF + '\".');
	    }
	    rolloff = Attenuation.DEFAULT_ROLLOFF;
	  } else {
	    rolloff = rolloff.toString().toLowerCase();
	  }
	  this._rolloff = rolloff;
	}

	/** Rolloff models (e.g. 'logarithmic', 'linear', or 'none').
	 * @type {Array}
	 */
	Attenuation.ROLLOFFS = ['logarithmic', 'linear', 'none'];
	/** Default rolloff model ('logarithmic').
	 * @type {string}
	 */
	Attenuation.DEFAULT_ROLLOFF = 'logarithmic';
	/** @type {Number} */
	Attenuation.MIN_DISTANCE = 1;
	/** @type {Number} */
	Attenuation.MAX_DISTANCE = 1000;


	module.exports = Attenuation;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

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
	 * @file Spatially encodes input using spherical harmonics.
	 * @author Andrew Allen <bitllama@google.com>
	 */

	'use strict';

	// Internal dependencies.
	var Tables = __webpack_require__(10);
	var Utils = __webpack_require__(4);

	/**
	 * @class Encoder
	 * @description Spatially encodes input using weighted spherical harmonics.
	 * @param {AudioContext} context
	 * Associated {@link
	https://developer.mozilla.org/en-US/docs/Web/API/AudioContext AudioContext}.
	 * @param {Object} options
	 * @param {Number} options.ambisonicOrder
	 * Desired ambisonic Order. Defaults to
	 * {@link DEFAULT_AMBISONIC_ORDER DEFAULT_AMBISONIC_ORDER}.
	 * @param {Number} options.azimuth
	 * Azimuth (in degrees). Defaults to
	 * {@link Encoder.DEFAULT_AZIMUTH DEFAULT_AZIMUTH}.
	 * @param {Number} options.elevation
	 * Elevation (in degrees). Defaults to
	 * {@link Encoder.DEFAULT_ELEVATION DEFAULT_ELEVATION}.
	 */
	function Encoder (context, ambisonicOrder) {
	  // Public variables.
	  /**
	   * Input {@link
	   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
	   * @member {AudioNode} input
	   * @memberof Encoder
	   * @instance
	   */
	  /**
	   * Output {@link
	   * https://developer.mozilla.org/en-US/docs/Web/API/AudioNode AudioNode}.
	   * @member {AudioNode} output
	   * @memberof Encoder
	   * @instance
	   */
	  this._ambisonicOrder = ambisonicOrder;
	  if (this._ambisonicOrder > Encoder.MAX_ORDER) {
	    Utils.log('(Error):\nUnable to render ambisonic order',
	      ambisonic_order, '(Max order is', Encoder.MAX_ORDER,
	      ')\nUsing max order instead.');
	    this._ambisonicOrder = Encoder.MAX_ORDER;
	  }

	  var num_channels = (this._ambisonicOrder + 1) * (this._ambisonicOrder + 1);
	  this._merger = context.createChannelMerger(num_channels);
	  this._masterGain = context.createGain();
	  this._channelGain = new Array(num_channels);
	  for (var i = 0; i < num_channels; i++) {
	    this._channelGain[i] = context.createGain();
	    this._masterGain.connect(this._channelGain[i]);
	    this._channelGain[i].connect(this._merger, 0, i);
	  }

	  // Input/Output proxy.
	  this.input = this._masterGain;
	  this.output = this._merger;
	}

	/**
	 * Set the direction of the encoded source signal.
	 * @param {Number} azimuth
	 * Azimuth (in degrees). Defaults to
	 * {@link Encoder.DEFAULT_AZIMUTH DEFAULT_AZIMUTH}.
	 * @param {Number} elevation
	 * Elevation (in degrees). Defaults to
	 * {@link Encoder.DEFAULT_ELEVATION DEFAULT_ELEVATION}.
	 */
	Encoder.prototype.setDirection = function (azimuth, elevation) {
	  // Format input direction to nearest indices.
	  if (azimuth == undefined || isNaN(azimuth)) {
	    azimuth = Encoder.DEFAULT_AZIMUTH;
	  }
	  if (elevation == undefined || isNaN(elevation)) {
	    elevation = Encoder.DEFAULT_ELEVATION;
	  }

	  azimuth = Math.round(azimuth % 360);
	  if (azimuth < 0) {
	    azimuth += 360;
	  }
	  elevation = Math.round(Math.min(90, Math.max(-90, elevation))) + 90;

	  // Assign gains to each output.
	  for (var i = 1; i <= this._ambisonicOrder; i++) {
	    for (var j = -i; j <= i; j++) {
	      var acnChannel = (i * i) + i + j;
	      var elevationIndex = i * (i + 1) / 2 + Math.abs(j) - 1;
	      var val = Tables.SPHERICAL_HARMONICS[1][elevation][elevationIndex];
	      if (j != 0) {
	        var azimuthIndex = Encoder.MAX_ORDER + j - 1;
	        if (j < 0) {
	          azimuthIndex = Encoder.MAX_ORDER + j;
	        }
	        val *= Tables.SPHERICAL_HARMONICS[0][azimuth][azimuthIndex];
	      }
	      this._channelGain[acnChannel].gain.value = val;
	    }
	  }
	}

	//TODO(bitllama): finish spread function!!!
	Encoder.prototype.setSpread = function (spread) {
	  spread = Math.min(360, Math.max(0, spread));
	  if (spread > Globals.MinSpreadPerAmbisonicOrder[this._ambisonicOrder]) {

	  }
	}

	/** @type {Number} */
	Encoder.DEFAULT_AZIMUTH = 0;
	/** @type {Number} */
	Encoder.DEFAULT_ELEVATION = 0;
	/** @type {Number} */
	Encoder.MAX_ORDER = Tables.SPHERICAL_HARMONICS[0][0].length / 2;

	module.exports = Encoder;

/***/ }),
/* 10 */
/***/ (function(module, exports) {

	/**
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
	 * @file Pre-computed lookup tables for encoding ambisonic sources.
	 * @author Andrew Allen <bitllama@google.com>
	 */

	'use strict';

	/**
	 * Pre-computed Spherical Harmonics Coefficients.
	 *
	 * This function generates an efficient lookup table of SH coefficients. It
	 * exploits the way SHs are generated (i.e. Ylm = Nlm * Plm * Em). Since Nlm
	 * & Plm coefficients only depend on theta, and Em only depends on phi, we
	 * can separate the equation along these lines. Em does not depend on
	 * degree, so we only need to compute (2 * l) per azimuth Em total and
	 * Nlm * Plm is symmetrical across indexes, so only positive indexes are
	 * computed (l * (l + 1) / 2) per elevation.
	 * @type {Float32Array}
	 */
	exports.SPHERICAL_HARMONICS =
	[
	  [
	    [
	      0,
	      0,
	      0,
	      1,
	      1,
	      1
	    ],
	    [
	      0.0523359552,
	      0.0348994955,
	      0.0174524058,
	      0.99984771,
	      0.999390841,
	      0.99862951
	    ],
	    [
	      0.104528464,
	      0.0697564706,
	      0.0348994955,
	      0.999390841,
	      0.997564077,
	      0.994521916
	    ],
	    [
	      0.156434461,
	      0.104528464,
	      0.0523359552,
	      0.99862951,
	      0.994521916,
	      0.987688363
	    ],
	    [
	      0.207911685,
	      0.139173105,
	      0.0697564706,
	      0.997564077,
	      0.990268052,
	      0.978147626
	    ],
	    [
	      0.258819044,
	      0.173648179,
	      0.0871557444,
	      0.99619472,
	      0.98480773,
	      0.965925813
	    ],
	    [
	      0.309017,
	      0.207911685,
	      0.104528464,
	      0.994521916,
	      0.978147626,
	      0.95105654
	    ],
	    [
	      0.35836795,
	      0.241921902,
	      0.121869341,
	      0.992546141,
	      0.970295727,
	      0.933580399
	    ],
	    [
	      0.406736642,
	      0.275637358,
	      0.139173105,
	      0.990268052,
	      0.96126169,
	      0.91354543
	    ],
	    [
	      0.453990489,
	      0.309017,
	      0.156434461,
	      0.987688363,
	      0.95105654,
	      0.891006529
	    ],
	    [
	      0.5,
	      0.342020154,
	      0.173648179,
	      0.98480773,
	      0.939692616,
	      0.866025388
	    ],
	    [
	      0.544639051,
	      0.37460658,
	      0.190809,
	      0.981627166,
	      0.927183867,
	      0.838670552
	    ],
	    [
	      0.587785244,
	      0.406736642,
	      0.207911685,
	      0.978147626,
	      0.91354543,
	      0.809017
	    ],
	    [
	      0.629320383,
	      0.438371152,
	      0.224951059,
	      0.974370062,
	      0.898794055,
	      0.777146
	    ],
	    [
	      0.669130623,
	      0.469471574,
	      0.241921902,
	      0.970295727,
	      0.882947564,
	      0.74314481
	    ],
	    [
	      0.707106769,
	      0.5,
	      0.258819044,
	      0.965925813,
	      0.866025388,
	      0.707106769
	    ],
	    [
	      0.74314481,
	      0.529919267,
	      0.275637358,
	      0.96126169,
	      0.848048091,
	      0.669130623
	    ],
	    [
	      0.777146,
	      0.559192896,
	      0.29237169,
	      0.956304729,
	      0.829037547,
	      0.629320383
	    ],
	    [
	      0.809017,
	      0.587785244,
	      0.309017,
	      0.95105654,
	      0.809017,
	      0.587785244
	    ],
	    [
	      0.838670552,
	      0.615661502,
	      0.325568169,
	      0.945518553,
	      0.788010776,
	      0.544639051
	    ],
	    [
	      0.866025388,
	      0.642787635,
	      0.342020154,
	      0.939692616,
	      0.766044438,
	      0.5
	    ],
	    [
	      0.891006529,
	      0.669130623,
	      0.35836795,
	      0.933580399,
	      0.74314481,
	      0.453990489
	    ],
	    [
	      0.91354543,
	      0.694658399,
	      0.37460658,
	      0.927183867,
	      0.719339788,
	      0.406736642
	    ],
	    [
	      0.933580399,
	      0.719339788,
	      0.390731126,
	      0.920504868,
	      0.694658399,
	      0.35836795
	    ],
	    [
	      0.95105654,
	      0.74314481,
	      0.406736642,
	      0.91354543,
	      0.669130623,
	      0.309017
	    ],
	    [
	      0.965925813,
	      0.766044438,
	      0.42261827,
	      0.906307817,
	      0.642787635,
	      0.258819044
	    ],
	    [
	      0.978147626,
	      0.788010776,
	      0.438371152,
	      0.898794055,
	      0.615661502,
	      0.207911685
	    ],
	    [
	      0.987688363,
	      0.809017,
	      0.453990489,
	      0.891006529,
	      0.587785244,
	      0.156434461
	    ],
	    [
	      0.994521916,
	      0.829037547,
	      0.469471574,
	      0.882947564,
	      0.559192896,
	      0.104528464
	    ],
	    [
	      0.99862951,
	      0.848048091,
	      0.484809607,
	      0.874619722,
	      0.529919267,
	      0.0523359552
	    ],
	    [
	      1,
	      0.866025388,
	      0.5,
	      0.866025388,
	      0.5,
	      6.12323426e-17
	    ],
	    [
	      0.99862951,
	      0.882947564,
	      0.515038073,
	      0.857167304,
	      0.469471574,
	      -0.0523359552
	    ],
	    [
	      0.994521916,
	      0.898794055,
	      0.529919267,
	      0.848048091,
	      0.438371152,
	      -0.104528464
	    ],
	    [
	      0.987688363,
	      0.91354543,
	      0.544639051,
	      0.838670552,
	      0.406736642,
	      -0.156434461
	    ],
	    [
	      0.978147626,
	      0.927183867,
	      0.559192896,
	      0.829037547,
	      0.37460658,
	      -0.207911685
	    ],
	    [
	      0.965925813,
	      0.939692616,
	      0.57357645,
	      0.819152057,
	      0.342020154,
	      -0.258819044
	    ],
	    [
	      0.95105654,
	      0.95105654,
	      0.587785244,
	      0.809017,
	      0.309017,
	      -0.309017
	    ],
	    [
	      0.933580399,
	      0.96126169,
	      0.601815045,
	      0.798635483,
	      0.275637358,
	      -0.35836795
	    ],
	    [
	      0.91354543,
	      0.970295727,
	      0.615661502,
	      0.788010776,
	      0.241921902,
	      -0.406736642
	    ],
	    [
	      0.891006529,
	      0.978147626,
	      0.629320383,
	      0.777146,
	      0.207911685,
	      -0.453990489
	    ],
	    [
	      0.866025388,
	      0.98480773,
	      0.642787635,
	      0.766044438,
	      0.173648179,
	      -0.5
	    ],
	    [
	      0.838670552,
	      0.990268052,
	      0.656059,
	      0.754709601,
	      0.139173105,
	      -0.544639051
	    ],
	    [
	      0.809017,
	      0.994521916,
	      0.669130623,
	      0.74314481,
	      0.104528464,
	      -0.587785244
	    ],
	    [
	      0.777146,
	      0.997564077,
	      0.681998372,
	      0.7313537,
	      0.0697564706,
	      -0.629320383
	    ],
	    [
	      0.74314481,
	      0.999390841,
	      0.694658399,
	      0.719339788,
	      0.0348994955,
	      -0.669130623
	    ],
	    [
	      0.707106769,
	      1,
	      0.707106769,
	      0.707106769,
	      6.12323426e-17,
	      -0.707106769
	    ],
	    [
	      0.669130623,
	      0.999390841,
	      0.719339788,
	      0.694658399,
	      -0.0348994955,
	      -0.74314481
	    ],
	    [
	      0.629320383,
	      0.997564077,
	      0.7313537,
	      0.681998372,
	      -0.0697564706,
	      -0.777146
	    ],
	    [
	      0.587785244,
	      0.994521916,
	      0.74314481,
	      0.669130623,
	      -0.104528464,
	      -0.809017
	    ],
	    [
	      0.544639051,
	      0.990268052,
	      0.754709601,
	      0.656059,
	      -0.139173105,
	      -0.838670552
	    ],
	    [
	      0.5,
	      0.98480773,
	      0.766044438,
	      0.642787635,
	      -0.173648179,
	      -0.866025388
	    ],
	    [
	      0.453990489,
	      0.978147626,
	      0.777146,
	      0.629320383,
	      -0.207911685,
	      -0.891006529
	    ],
	    [
	      0.406736642,
	      0.970295727,
	      0.788010776,
	      0.615661502,
	      -0.241921902,
	      -0.91354543
	    ],
	    [
	      0.35836795,
	      0.96126169,
	      0.798635483,
	      0.601815045,
	      -0.275637358,
	      -0.933580399
	    ],
	    [
	      0.309017,
	      0.95105654,
	      0.809017,
	      0.587785244,
	      -0.309017,
	      -0.95105654
	    ],
	    [
	      0.258819044,
	      0.939692616,
	      0.819152057,
	      0.57357645,
	      -0.342020154,
	      -0.965925813
	    ],
	    [
	      0.207911685,
	      0.927183867,
	      0.829037547,
	      0.559192896,
	      -0.37460658,
	      -0.978147626
	    ],
	    [
	      0.156434461,
	      0.91354543,
	      0.838670552,
	      0.544639051,
	      -0.406736642,
	      -0.987688363
	    ],
	    [
	      0.104528464,
	      0.898794055,
	      0.848048091,
	      0.529919267,
	      -0.438371152,
	      -0.994521916
	    ],
	    [
	      0.0523359552,
	      0.882947564,
	      0.857167304,
	      0.515038073,
	      -0.469471574,
	      -0.99862951
	    ],
	    [
	      1.22464685e-16,
	      0.866025388,
	      0.866025388,
	      0.5,
	      -0.5,
	      -1
	    ],
	    [
	      -0.0523359552,
	      0.848048091,
	      0.874619722,
	      0.484809607,
	      -0.529919267,
	      -0.99862951
	    ],
	    [
	      -0.104528464,
	      0.829037547,
	      0.882947564,
	      0.469471574,
	      -0.559192896,
	      -0.994521916
	    ],
	    [
	      -0.156434461,
	      0.809017,
	      0.891006529,
	      0.453990489,
	      -0.587785244,
	      -0.987688363
	    ],
	    [
	      -0.207911685,
	      0.788010776,
	      0.898794055,
	      0.438371152,
	      -0.615661502,
	      -0.978147626
	    ],
	    [
	      -0.258819044,
	      0.766044438,
	      0.906307817,
	      0.42261827,
	      -0.642787635,
	      -0.965925813
	    ],
	    [
	      -0.309017,
	      0.74314481,
	      0.91354543,
	      0.406736642,
	      -0.669130623,
	      -0.95105654
	    ],
	    [
	      -0.35836795,
	      0.719339788,
	      0.920504868,
	      0.390731126,
	      -0.694658399,
	      -0.933580399
	    ],
	    [
	      -0.406736642,
	      0.694658399,
	      0.927183867,
	      0.37460658,
	      -0.719339788,
	      -0.91354543
	    ],
	    [
	      -0.453990489,
	      0.669130623,
	      0.933580399,
	      0.35836795,
	      -0.74314481,
	      -0.891006529
	    ],
	    [
	      -0.5,
	      0.642787635,
	      0.939692616,
	      0.342020154,
	      -0.766044438,
	      -0.866025388
	    ],
	    [
	      -0.544639051,
	      0.615661502,
	      0.945518553,
	      0.325568169,
	      -0.788010776,
	      -0.838670552
	    ],
	    [
	      -0.587785244,
	      0.587785244,
	      0.95105654,
	      0.309017,
	      -0.809017,
	      -0.809017
	    ],
	    [
	      -0.629320383,
	      0.559192896,
	      0.956304729,
	      0.29237169,
	      -0.829037547,
	      -0.777146
	    ],
	    [
	      -0.669130623,
	      0.529919267,
	      0.96126169,
	      0.275637358,
	      -0.848048091,
	      -0.74314481
	    ],
	    [
	      -0.707106769,
	      0.5,
	      0.965925813,
	      0.258819044,
	      -0.866025388,
	      -0.707106769
	    ],
	    [
	      -0.74314481,
	      0.469471574,
	      0.970295727,
	      0.241921902,
	      -0.882947564,
	      -0.669130623
	    ],
	    [
	      -0.777146,
	      0.438371152,
	      0.974370062,
	      0.224951059,
	      -0.898794055,
	      -0.629320383
	    ],
	    [
	      -0.809017,
	      0.406736642,
	      0.978147626,
	      0.207911685,
	      -0.91354543,
	      -0.587785244
	    ],
	    [
	      -0.838670552,
	      0.37460658,
	      0.981627166,
	      0.190809,
	      -0.927183867,
	      -0.544639051
	    ],
	    [
	      -0.866025388,
	      0.342020154,
	      0.98480773,
	      0.173648179,
	      -0.939692616,
	      -0.5
	    ],
	    [
	      -0.891006529,
	      0.309017,
	      0.987688363,
	      0.156434461,
	      -0.95105654,
	      -0.453990489
	    ],
	    [
	      -0.91354543,
	      0.275637358,
	      0.990268052,
	      0.139173105,
	      -0.96126169,
	      -0.406736642
	    ],
	    [
	      -0.933580399,
	      0.241921902,
	      0.992546141,
	      0.121869341,
	      -0.970295727,
	      -0.35836795
	    ],
	    [
	      -0.95105654,
	      0.207911685,
	      0.994521916,
	      0.104528464,
	      -0.978147626,
	      -0.309017
	    ],
	    [
	      -0.965925813,
	      0.173648179,
	      0.99619472,
	      0.0871557444,
	      -0.98480773,
	      -0.258819044
	    ],
	    [
	      -0.978147626,
	      0.139173105,
	      0.997564077,
	      0.0697564706,
	      -0.990268052,
	      -0.207911685
	    ],
	    [
	      -0.987688363,
	      0.104528464,
	      0.99862951,
	      0.0523359552,
	      -0.994521916,
	      -0.156434461
	    ],
	    [
	      -0.994521916,
	      0.0697564706,
	      0.999390841,
	      0.0348994955,
	      -0.997564077,
	      -0.104528464
	    ],
	    [
	      -0.99862951,
	      0.0348994955,
	      0.99984771,
	      0.0174524058,
	      -0.999390841,
	      -0.0523359552
	    ],
	    [
	      -1,
	      1.22464685e-16,
	      1,
	      6.12323426e-17,
	      -1,
	      -1.83697015e-16
	    ],
	    [
	      -0.99862951,
	      -0.0348994955,
	      0.99984771,
	      -0.0174524058,
	      -0.999390841,
	      0.0523359552
	    ],
	    [
	      -0.994521916,
	      -0.0697564706,
	      0.999390841,
	      -0.0348994955,
	      -0.997564077,
	      0.104528464
	    ],
	    [
	      -0.987688363,
	      -0.104528464,
	      0.99862951,
	      -0.0523359552,
	      -0.994521916,
	      0.156434461
	    ],
	    [
	      -0.978147626,
	      -0.139173105,
	      0.997564077,
	      -0.0697564706,
	      -0.990268052,
	      0.207911685
	    ],
	    [
	      -0.965925813,
	      -0.173648179,
	      0.99619472,
	      -0.0871557444,
	      -0.98480773,
	      0.258819044
	    ],
	    [
	      -0.95105654,
	      -0.207911685,
	      0.994521916,
	      -0.104528464,
	      -0.978147626,
	      0.309017
	    ],
	    [
	      -0.933580399,
	      -0.241921902,
	      0.992546141,
	      -0.121869341,
	      -0.970295727,
	      0.35836795
	    ],
	    [
	      -0.91354543,
	      -0.275637358,
	      0.990268052,
	      -0.139173105,
	      -0.96126169,
	      0.406736642
	    ],
	    [
	      -0.891006529,
	      -0.309017,
	      0.987688363,
	      -0.156434461,
	      -0.95105654,
	      0.453990489
	    ],
	    [
	      -0.866025388,
	      -0.342020154,
	      0.98480773,
	      -0.173648179,
	      -0.939692616,
	      0.5
	    ],
	    [
	      -0.838670552,
	      -0.37460658,
	      0.981627166,
	      -0.190809,
	      -0.927183867,
	      0.544639051
	    ],
	    [
	      -0.809017,
	      -0.406736642,
	      0.978147626,
	      -0.207911685,
	      -0.91354543,
	      0.587785244
	    ],
	    [
	      -0.777146,
	      -0.438371152,
	      0.974370062,
	      -0.224951059,
	      -0.898794055,
	      0.629320383
	    ],
	    [
	      -0.74314481,
	      -0.469471574,
	      0.970295727,
	      -0.241921902,
	      -0.882947564,
	      0.669130623
	    ],
	    [
	      -0.707106769,
	      -0.5,
	      0.965925813,
	      -0.258819044,
	      -0.866025388,
	      0.707106769
	    ],
	    [
	      -0.669130623,
	      -0.529919267,
	      0.96126169,
	      -0.275637358,
	      -0.848048091,
	      0.74314481
	    ],
	    [
	      -0.629320383,
	      -0.559192896,
	      0.956304729,
	      -0.29237169,
	      -0.829037547,
	      0.777146
	    ],
	    [
	      -0.587785244,
	      -0.587785244,
	      0.95105654,
	      -0.309017,
	      -0.809017,
	      0.809017
	    ],
	    [
	      -0.544639051,
	      -0.615661502,
	      0.945518553,
	      -0.325568169,
	      -0.788010776,
	      0.838670552
	    ],
	    [
	      -0.5,
	      -0.642787635,
	      0.939692616,
	      -0.342020154,
	      -0.766044438,
	      0.866025388
	    ],
	    [
	      -0.453990489,
	      -0.669130623,
	      0.933580399,
	      -0.35836795,
	      -0.74314481,
	      0.891006529
	    ],
	    [
	      -0.406736642,
	      -0.694658399,
	      0.927183867,
	      -0.37460658,
	      -0.719339788,
	      0.91354543
	    ],
	    [
	      -0.35836795,
	      -0.719339788,
	      0.920504868,
	      -0.390731126,
	      -0.694658399,
	      0.933580399
	    ],
	    [
	      -0.309017,
	      -0.74314481,
	      0.91354543,
	      -0.406736642,
	      -0.669130623,
	      0.95105654
	    ],
	    [
	      -0.258819044,
	      -0.766044438,
	      0.906307817,
	      -0.42261827,
	      -0.642787635,
	      0.965925813
	    ],
	    [
	      -0.207911685,
	      -0.788010776,
	      0.898794055,
	      -0.438371152,
	      -0.615661502,
	      0.978147626
	    ],
	    [
	      -0.156434461,
	      -0.809017,
	      0.891006529,
	      -0.453990489,
	      -0.587785244,
	      0.987688363
	    ],
	    [
	      -0.104528464,
	      -0.829037547,
	      0.882947564,
	      -0.469471574,
	      -0.559192896,
	      0.994521916
	    ],
	    [
	      -0.0523359552,
	      -0.848048091,
	      0.874619722,
	      -0.484809607,
	      -0.529919267,
	      0.99862951
	    ],
	    [
	      -2.44929371e-16,
	      -0.866025388,
	      0.866025388,
	      -0.5,
	      -0.5,
	      1
	    ],
	    [
	      0.0523359552,
	      -0.882947564,
	      0.857167304,
	      -0.515038073,
	      -0.469471574,
	      0.99862951
	    ],
	    [
	      0.104528464,
	      -0.898794055,
	      0.848048091,
	      -0.529919267,
	      -0.438371152,
	      0.994521916
	    ],
	    [
	      0.156434461,
	      -0.91354543,
	      0.838670552,
	      -0.544639051,
	      -0.406736642,
	      0.987688363
	    ],
	    [
	      0.207911685,
	      -0.927183867,
	      0.829037547,
	      -0.559192896,
	      -0.37460658,
	      0.978147626
	    ],
	    [
	      0.258819044,
	      -0.939692616,
	      0.819152057,
	      -0.57357645,
	      -0.342020154,
	      0.965925813
	    ],
	    [
	      0.309017,
	      -0.95105654,
	      0.809017,
	      -0.587785244,
	      -0.309017,
	      0.95105654
	    ],
	    [
	      0.35836795,
	      -0.96126169,
	      0.798635483,
	      -0.601815045,
	      -0.275637358,
	      0.933580399
	    ],
	    [
	      0.406736642,
	      -0.970295727,
	      0.788010776,
	      -0.615661502,
	      -0.241921902,
	      0.91354543
	    ],
	    [
	      0.453990489,
	      -0.978147626,
	      0.777146,
	      -0.629320383,
	      -0.207911685,
	      0.891006529
	    ],
	    [
	      0.5,
	      -0.98480773,
	      0.766044438,
	      -0.642787635,
	      -0.173648179,
	      0.866025388
	    ],
	    [
	      0.544639051,
	      -0.990268052,
	      0.754709601,
	      -0.656059,
	      -0.139173105,
	      0.838670552
	    ],
	    [
	      0.587785244,
	      -0.994521916,
	      0.74314481,
	      -0.669130623,
	      -0.104528464,
	      0.809017
	    ],
	    [
	      0.629320383,
	      -0.997564077,
	      0.7313537,
	      -0.681998372,
	      -0.0697564706,
	      0.777146
	    ],
	    [
	      0.669130623,
	      -0.999390841,
	      0.719339788,
	      -0.694658399,
	      -0.0348994955,
	      0.74314481
	    ],
	    [
	      0.707106769,
	      -1,
	      0.707106769,
	      -0.707106769,
	      -1.83697015e-16,
	      0.707106769
	    ],
	    [
	      0.74314481,
	      -0.999390841,
	      0.694658399,
	      -0.719339788,
	      0.0348994955,
	      0.669130623
	    ],
	    [
	      0.777146,
	      -0.997564077,
	      0.681998372,
	      -0.7313537,
	      0.0697564706,
	      0.629320383
	    ],
	    [
	      0.809017,
	      -0.994521916,
	      0.669130623,
	      -0.74314481,
	      0.104528464,
	      0.587785244
	    ],
	    [
	      0.838670552,
	      -0.990268052,
	      0.656059,
	      -0.754709601,
	      0.139173105,
	      0.544639051
	    ],
	    [
	      0.866025388,
	      -0.98480773,
	      0.642787635,
	      -0.766044438,
	      0.173648179,
	      0.5
	    ],
	    [
	      0.891006529,
	      -0.978147626,
	      0.629320383,
	      -0.777146,
	      0.207911685,
	      0.453990489
	    ],
	    [
	      0.91354543,
	      -0.970295727,
	      0.615661502,
	      -0.788010776,
	      0.241921902,
	      0.406736642
	    ],
	    [
	      0.933580399,
	      -0.96126169,
	      0.601815045,
	      -0.798635483,
	      0.275637358,
	      0.35836795
	    ],
	    [
	      0.95105654,
	      -0.95105654,
	      0.587785244,
	      -0.809017,
	      0.309017,
	      0.309017
	    ],
	    [
	      0.965925813,
	      -0.939692616,
	      0.57357645,
	      -0.819152057,
	      0.342020154,
	      0.258819044
	    ],
	    [
	      0.978147626,
	      -0.927183867,
	      0.559192896,
	      -0.829037547,
	      0.37460658,
	      0.207911685
	    ],
	    [
	      0.987688363,
	      -0.91354543,
	      0.544639051,
	      -0.838670552,
	      0.406736642,
	      0.156434461
	    ],
	    [
	      0.994521916,
	      -0.898794055,
	      0.529919267,
	      -0.848048091,
	      0.438371152,
	      0.104528464
	    ],
	    [
	      0.99862951,
	      -0.882947564,
	      0.515038073,
	      -0.857167304,
	      0.469471574,
	      0.0523359552
	    ],
	    [
	      1,
	      -0.866025388,
	      0.5,
	      -0.866025388,
	      0.5,
	      3.061617e-16
	    ],
	    [
	      0.99862951,
	      -0.848048091,
	      0.484809607,
	      -0.874619722,
	      0.529919267,
	      -0.0523359552
	    ],
	    [
	      0.994521916,
	      -0.829037547,
	      0.469471574,
	      -0.882947564,
	      0.559192896,
	      -0.104528464
	    ],
	    [
	      0.987688363,
	      -0.809017,
	      0.453990489,
	      -0.891006529,
	      0.587785244,
	      -0.156434461
	    ],
	    [
	      0.978147626,
	      -0.788010776,
	      0.438371152,
	      -0.898794055,
	      0.615661502,
	      -0.207911685
	    ],
	    [
	      0.965925813,
	      -0.766044438,
	      0.42261827,
	      -0.906307817,
	      0.642787635,
	      -0.258819044
	    ],
	    [
	      0.95105654,
	      -0.74314481,
	      0.406736642,
	      -0.91354543,
	      0.669130623,
	      -0.309017
	    ],
	    [
	      0.933580399,
	      -0.719339788,
	      0.390731126,
	      -0.920504868,
	      0.694658399,
	      -0.35836795
	    ],
	    [
	      0.91354543,
	      -0.694658399,
	      0.37460658,
	      -0.927183867,
	      0.719339788,
	      -0.406736642
	    ],
	    [
	      0.891006529,
	      -0.669130623,
	      0.35836795,
	      -0.933580399,
	      0.74314481,
	      -0.453990489
	    ],
	    [
	      0.866025388,
	      -0.642787635,
	      0.342020154,
	      -0.939692616,
	      0.766044438,
	      -0.5
	    ],
	    [
	      0.838670552,
	      -0.615661502,
	      0.325568169,
	      -0.945518553,
	      0.788010776,
	      -0.544639051
	    ],
	    [
	      0.809017,
	      -0.587785244,
	      0.309017,
	      -0.95105654,
	      0.809017,
	      -0.587785244
	    ],
	    [
	      0.777146,
	      -0.559192896,
	      0.29237169,
	      -0.956304729,
	      0.829037547,
	      -0.629320383
	    ],
	    [
	      0.74314481,
	      -0.529919267,
	      0.275637358,
	      -0.96126169,
	      0.848048091,
	      -0.669130623
	    ],
	    [
	      0.707106769,
	      -0.5,
	      0.258819044,
	      -0.965925813,
	      0.866025388,
	      -0.707106769
	    ],
	    [
	      0.669130623,
	      -0.469471574,
	      0.241921902,
	      -0.970295727,
	      0.882947564,
	      -0.74314481
	    ],
	    [
	      0.629320383,
	      -0.438371152,
	      0.224951059,
	      -0.974370062,
	      0.898794055,
	      -0.777146
	    ],
	    [
	      0.587785244,
	      -0.406736642,
	      0.207911685,
	      -0.978147626,
	      0.91354543,
	      -0.809017
	    ],
	    [
	      0.544639051,
	      -0.37460658,
	      0.190809,
	      -0.981627166,
	      0.927183867,
	      -0.838670552
	    ],
	    [
	      0.5,
	      -0.342020154,
	      0.173648179,
	      -0.98480773,
	      0.939692616,
	      -0.866025388
	    ],
	    [
	      0.453990489,
	      -0.309017,
	      0.156434461,
	      -0.987688363,
	      0.95105654,
	      -0.891006529
	    ],
	    [
	      0.406736642,
	      -0.275637358,
	      0.139173105,
	      -0.990268052,
	      0.96126169,
	      -0.91354543
	    ],
	    [
	      0.35836795,
	      -0.241921902,
	      0.121869341,
	      -0.992546141,
	      0.970295727,
	      -0.933580399
	    ],
	    [
	      0.309017,
	      -0.207911685,
	      0.104528464,
	      -0.994521916,
	      0.978147626,
	      -0.95105654
	    ],
	    [
	      0.258819044,
	      -0.173648179,
	      0.0871557444,
	      -0.99619472,
	      0.98480773,
	      -0.965925813
	    ],
	    [
	      0.207911685,
	      -0.139173105,
	      0.0697564706,
	      -0.997564077,
	      0.990268052,
	      -0.978147626
	    ],
	    [
	      0.156434461,
	      -0.104528464,
	      0.0523359552,
	      -0.99862951,
	      0.994521916,
	      -0.987688363
	    ],
	    [
	      0.104528464,
	      -0.0697564706,
	      0.0348994955,
	      -0.999390841,
	      0.997564077,
	      -0.994521916
	    ],
	    [
	      0.0523359552,
	      -0.0348994955,
	      0.0174524058,
	      -0.99984771,
	      0.999390841,
	      -0.99862951
	    ],
	    [
	      3.67394029e-16,
	      -2.44929371e-16,
	      1.22464685e-16,
	      -1,
	      1,
	      -1
	    ],
	    [
	      -0.0523359552,
	      0.0348994955,
	      -0.0174524058,
	      -0.99984771,
	      0.999390841,
	      -0.99862951
	    ],
	    [
	      -0.104528464,
	      0.0697564706,
	      -0.0348994955,
	      -0.999390841,
	      0.997564077,
	      -0.994521916
	    ],
	    [
	      -0.156434461,
	      0.104528464,
	      -0.0523359552,
	      -0.99862951,
	      0.994521916,
	      -0.987688363
	    ],
	    [
	      -0.207911685,
	      0.139173105,
	      -0.0697564706,
	      -0.997564077,
	      0.990268052,
	      -0.978147626
	    ],
	    [
	      -0.258819044,
	      0.173648179,
	      -0.0871557444,
	      -0.99619472,
	      0.98480773,
	      -0.965925813
	    ],
	    [
	      -0.309017,
	      0.207911685,
	      -0.104528464,
	      -0.994521916,
	      0.978147626,
	      -0.95105654
	    ],
	    [
	      -0.35836795,
	      0.241921902,
	      -0.121869341,
	      -0.992546141,
	      0.970295727,
	      -0.933580399
	    ],
	    [
	      -0.406736642,
	      0.275637358,
	      -0.139173105,
	      -0.990268052,
	      0.96126169,
	      -0.91354543
	    ],
	    [
	      -0.453990489,
	      0.309017,
	      -0.156434461,
	      -0.987688363,
	      0.95105654,
	      -0.891006529
	    ],
	    [
	      -0.5,
	      0.342020154,
	      -0.173648179,
	      -0.98480773,
	      0.939692616,
	      -0.866025388
	    ],
	    [
	      -0.544639051,
	      0.37460658,
	      -0.190809,
	      -0.981627166,
	      0.927183867,
	      -0.838670552
	    ],
	    [
	      -0.587785244,
	      0.406736642,
	      -0.207911685,
	      -0.978147626,
	      0.91354543,
	      -0.809017
	    ],
	    [
	      -0.629320383,
	      0.438371152,
	      -0.224951059,
	      -0.974370062,
	      0.898794055,
	      -0.777146
	    ],
	    [
	      -0.669130623,
	      0.469471574,
	      -0.241921902,
	      -0.970295727,
	      0.882947564,
	      -0.74314481
	    ],
	    [
	      -0.707106769,
	      0.5,
	      -0.258819044,
	      -0.965925813,
	      0.866025388,
	      -0.707106769
	    ],
	    [
	      -0.74314481,
	      0.529919267,
	      -0.275637358,
	      -0.96126169,
	      0.848048091,
	      -0.669130623
	    ],
	    [
	      -0.777146,
	      0.559192896,
	      -0.29237169,
	      -0.956304729,
	      0.829037547,
	      -0.629320383
	    ],
	    [
	      -0.809017,
	      0.587785244,
	      -0.309017,
	      -0.95105654,
	      0.809017,
	      -0.587785244
	    ],
	    [
	      -0.838670552,
	      0.615661502,
	      -0.325568169,
	      -0.945518553,
	      0.788010776,
	      -0.544639051
	    ],
	    [
	      -0.866025388,
	      0.642787635,
	      -0.342020154,
	      -0.939692616,
	      0.766044438,
	      -0.5
	    ],
	    [
	      -0.891006529,
	      0.669130623,
	      -0.35836795,
	      -0.933580399,
	      0.74314481,
	      -0.453990489
	    ],
	    [
	      -0.91354543,
	      0.694658399,
	      -0.37460658,
	      -0.927183867,
	      0.719339788,
	      -0.406736642
	    ],
	    [
	      -0.933580399,
	      0.719339788,
	      -0.390731126,
	      -0.920504868,
	      0.694658399,
	      -0.35836795
	    ],
	    [
	      -0.95105654,
	      0.74314481,
	      -0.406736642,
	      -0.91354543,
	      0.669130623,
	      -0.309017
	    ],
	    [
	      -0.965925813,
	      0.766044438,
	      -0.42261827,
	      -0.906307817,
	      0.642787635,
	      -0.258819044
	    ],
	    [
	      -0.978147626,
	      0.788010776,
	      -0.438371152,
	      -0.898794055,
	      0.615661502,
	      -0.207911685
	    ],
	    [
	      -0.987688363,
	      0.809017,
	      -0.453990489,
	      -0.891006529,
	      0.587785244,
	      -0.156434461
	    ],
	    [
	      -0.994521916,
	      0.829037547,
	      -0.469471574,
	      -0.882947564,
	      0.559192896,
	      -0.104528464
	    ],
	    [
	      -0.99862951,
	      0.848048091,
	      -0.484809607,
	      -0.874619722,
	      0.529919267,
	      -0.0523359552
	    ],
	    [
	      -1,
	      0.866025388,
	      -0.5,
	      -0.866025388,
	      0.5,
	      1.34773043e-15
	    ],
	    [
	      -0.99862951,
	      0.882947564,
	      -0.515038073,
	      -0.857167304,
	      0.469471574,
	      0.0523359552
	    ],
	    [
	      -0.994521916,
	      0.898794055,
	      -0.529919267,
	      -0.848048091,
	      0.438371152,
	      0.104528464
	    ],
	    [
	      -0.987688363,
	      0.91354543,
	      -0.544639051,
	      -0.838670552,
	      0.406736642,
	      0.156434461
	    ],
	    [
	      -0.978147626,
	      0.927183867,
	      -0.559192896,
	      -0.829037547,
	      0.37460658,
	      0.207911685
	    ],
	    [
	      -0.965925813,
	      0.939692616,
	      -0.57357645,
	      -0.819152057,
	      0.342020154,
	      0.258819044
	    ],
	    [
	      -0.95105654,
	      0.95105654,
	      -0.587785244,
	      -0.809017,
	      0.309017,
	      0.309017
	    ],
	    [
	      -0.933580399,
	      0.96126169,
	      -0.601815045,
	      -0.798635483,
	      0.275637358,
	      0.35836795
	    ],
	    [
	      -0.91354543,
	      0.970295727,
	      -0.615661502,
	      -0.788010776,
	      0.241921902,
	      0.406736642
	    ],
	    [
	      -0.891006529,
	      0.978147626,
	      -0.629320383,
	      -0.777146,
	      0.207911685,
	      0.453990489
	    ],
	    [
	      -0.866025388,
	      0.98480773,
	      -0.642787635,
	      -0.766044438,
	      0.173648179,
	      0.5
	    ],
	    [
	      -0.838670552,
	      0.990268052,
	      -0.656059,
	      -0.754709601,
	      0.139173105,
	      0.544639051
	    ],
	    [
	      -0.809017,
	      0.994521916,
	      -0.669130623,
	      -0.74314481,
	      0.104528464,
	      0.587785244
	    ],
	    [
	      -0.777146,
	      0.997564077,
	      -0.681998372,
	      -0.7313537,
	      0.0697564706,
	      0.629320383
	    ],
	    [
	      -0.74314481,
	      0.999390841,
	      -0.694658399,
	      -0.719339788,
	      0.0348994955,
	      0.669130623
	    ],
	    [
	      -0.707106769,
	      1,
	      -0.707106769,
	      -0.707106769,
	      3.061617e-16,
	      0.707106769
	    ],
	    [
	      -0.669130623,
	      0.999390841,
	      -0.719339788,
	      -0.694658399,
	      -0.0348994955,
	      0.74314481
	    ],
	    [
	      -0.629320383,
	      0.997564077,
	      -0.7313537,
	      -0.681998372,
	      -0.0697564706,
	      0.777146
	    ],
	    [
	      -0.587785244,
	      0.994521916,
	      -0.74314481,
	      -0.669130623,
	      -0.104528464,
	      0.809017
	    ],
	    [
	      -0.544639051,
	      0.990268052,
	      -0.754709601,
	      -0.656059,
	      -0.139173105,
	      0.838670552
	    ],
	    [
	      -0.5,
	      0.98480773,
	      -0.766044438,
	      -0.642787635,
	      -0.173648179,
	      0.866025388
	    ],
	    [
	      -0.453990489,
	      0.978147626,
	      -0.777146,
	      -0.629320383,
	      -0.207911685,
	      0.891006529
	    ],
	    [
	      -0.406736642,
	      0.970295727,
	      -0.788010776,
	      -0.615661502,
	      -0.241921902,
	      0.91354543
	    ],
	    [
	      -0.35836795,
	      0.96126169,
	      -0.798635483,
	      -0.601815045,
	      -0.275637358,
	      0.933580399
	    ],
	    [
	      -0.309017,
	      0.95105654,
	      -0.809017,
	      -0.587785244,
	      -0.309017,
	      0.95105654
	    ],
	    [
	      -0.258819044,
	      0.939692616,
	      -0.819152057,
	      -0.57357645,
	      -0.342020154,
	      0.965925813
	    ],
	    [
	      -0.207911685,
	      0.927183867,
	      -0.829037547,
	      -0.559192896,
	      -0.37460658,
	      0.978147626
	    ],
	    [
	      -0.156434461,
	      0.91354543,
	      -0.838670552,
	      -0.544639051,
	      -0.406736642,
	      0.987688363
	    ],
	    [
	      -0.104528464,
	      0.898794055,
	      -0.848048091,
	      -0.529919267,
	      -0.438371152,
	      0.994521916
	    ],
	    [
	      -0.0523359552,
	      0.882947564,
	      -0.857167304,
	      -0.515038073,
	      -0.469471574,
	      0.99862951
	    ],
	    [
	      -4.89858741e-16,
	      0.866025388,
	      -0.866025388,
	      -0.5,
	      -0.5,
	      1
	    ],
	    [
	      0.0523359552,
	      0.848048091,
	      -0.874619722,
	      -0.484809607,
	      -0.529919267,
	      0.99862951
	    ],
	    [
	      0.104528464,
	      0.829037547,
	      -0.882947564,
	      -0.469471574,
	      -0.559192896,
	      0.994521916
	    ],
	    [
	      0.156434461,
	      0.809017,
	      -0.891006529,
	      -0.453990489,
	      -0.587785244,
	      0.987688363
	    ],
	    [
	      0.207911685,
	      0.788010776,
	      -0.898794055,
	      -0.438371152,
	      -0.615661502,
	      0.978147626
	    ],
	    [
	      0.258819044,
	      0.766044438,
	      -0.906307817,
	      -0.42261827,
	      -0.642787635,
	      0.965925813
	    ],
	    [
	      0.309017,
	      0.74314481,
	      -0.91354543,
	      -0.406736642,
	      -0.669130623,
	      0.95105654
	    ],
	    [
	      0.35836795,
	      0.719339788,
	      -0.920504868,
	      -0.390731126,
	      -0.694658399,
	      0.933580399
	    ],
	    [
	      0.406736642,
	      0.694658399,
	      -0.927183867,
	      -0.37460658,
	      -0.719339788,
	      0.91354543
	    ],
	    [
	      0.453990489,
	      0.669130623,
	      -0.933580399,
	      -0.35836795,
	      -0.74314481,
	      0.891006529
	    ],
	    [
	      0.5,
	      0.642787635,
	      -0.939692616,
	      -0.342020154,
	      -0.766044438,
	      0.866025388
	    ],
	    [
	      0.544639051,
	      0.615661502,
	      -0.945518553,
	      -0.325568169,
	      -0.788010776,
	      0.838670552
	    ],
	    [
	      0.587785244,
	      0.587785244,
	      -0.95105654,
	      -0.309017,
	      -0.809017,
	      0.809017
	    ],
	    [
	      0.629320383,
	      0.559192896,
	      -0.956304729,
	      -0.29237169,
	      -0.829037547,
	      0.777146
	    ],
	    [
	      0.669130623,
	      0.529919267,
	      -0.96126169,
	      -0.275637358,
	      -0.848048091,
	      0.74314481
	    ],
	    [
	      0.707106769,
	      0.5,
	      -0.965925813,
	      -0.258819044,
	      -0.866025388,
	      0.707106769
	    ],
	    [
	      0.74314481,
	      0.469471574,
	      -0.970295727,
	      -0.241921902,
	      -0.882947564,
	      0.669130623
	    ],
	    [
	      0.777146,
	      0.438371152,
	      -0.974370062,
	      -0.224951059,
	      -0.898794055,
	      0.629320383
	    ],
	    [
	      0.809017,
	      0.406736642,
	      -0.978147626,
	      -0.207911685,
	      -0.91354543,
	      0.587785244
	    ],
	    [
	      0.838670552,
	      0.37460658,
	      -0.981627166,
	      -0.190809,
	      -0.927183867,
	      0.544639051
	    ],
	    [
	      0.866025388,
	      0.342020154,
	      -0.98480773,
	      -0.173648179,
	      -0.939692616,
	      0.5
	    ],
	    [
	      0.891006529,
	      0.309017,
	      -0.987688363,
	      -0.156434461,
	      -0.95105654,
	      0.453990489
	    ],
	    [
	      0.91354543,
	      0.275637358,
	      -0.990268052,
	      -0.139173105,
	      -0.96126169,
	      0.406736642
	    ],
	    [
	      0.933580399,
	      0.241921902,
	      -0.992546141,
	      -0.121869341,
	      -0.970295727,
	      0.35836795
	    ],
	    [
	      0.95105654,
	      0.207911685,
	      -0.994521916,
	      -0.104528464,
	      -0.978147626,
	      0.309017
	    ],
	    [
	      0.965925813,
	      0.173648179,
	      -0.99619472,
	      -0.0871557444,
	      -0.98480773,
	      0.258819044
	    ],
	    [
	      0.978147626,
	      0.139173105,
	      -0.997564077,
	      -0.0697564706,
	      -0.990268052,
	      0.207911685
	    ],
	    [
	      0.987688363,
	      0.104528464,
	      -0.99862951,
	      -0.0523359552,
	      -0.994521916,
	      0.156434461
	    ],
	    [
	      0.994521916,
	      0.0697564706,
	      -0.999390841,
	      -0.0348994955,
	      -0.997564077,
	      0.104528464
	    ],
	    [
	      0.99862951,
	      0.0348994955,
	      -0.99984771,
	      -0.0174524058,
	      -0.999390841,
	      0.0523359552
	    ],
	    [
	      1,
	      3.67394029e-16,
	      -1,
	      -1.83697015e-16,
	      -1,
	      5.5109107e-16
	    ],
	    [
	      0.99862951,
	      -0.0348994955,
	      -0.99984771,
	      0.0174524058,
	      -0.999390841,
	      -0.0523359552
	    ],
	    [
	      0.994521916,
	      -0.0697564706,
	      -0.999390841,
	      0.0348994955,
	      -0.997564077,
	      -0.104528464
	    ],
	    [
	      0.987688363,
	      -0.104528464,
	      -0.99862951,
	      0.0523359552,
	      -0.994521916,
	      -0.156434461
	    ],
	    [
	      0.978147626,
	      -0.139173105,
	      -0.997564077,
	      0.0697564706,
	      -0.990268052,
	      -0.207911685
	    ],
	    [
	      0.965925813,
	      -0.173648179,
	      -0.99619472,
	      0.0871557444,
	      -0.98480773,
	      -0.258819044
	    ],
	    [
	      0.95105654,
	      -0.207911685,
	      -0.994521916,
	      0.104528464,
	      -0.978147626,
	      -0.309017
	    ],
	    [
	      0.933580399,
	      -0.241921902,
	      -0.992546141,
	      0.121869341,
	      -0.970295727,
	      -0.35836795
	    ],
	    [
	      0.91354543,
	      -0.275637358,
	      -0.990268052,
	      0.139173105,
	      -0.96126169,
	      -0.406736642
	    ],
	    [
	      0.891006529,
	      -0.309017,
	      -0.987688363,
	      0.156434461,
	      -0.95105654,
	      -0.453990489
	    ],
	    [
	      0.866025388,
	      -0.342020154,
	      -0.98480773,
	      0.173648179,
	      -0.939692616,
	      -0.5
	    ],
	    [
	      0.838670552,
	      -0.37460658,
	      -0.981627166,
	      0.190809,
	      -0.927183867,
	      -0.544639051
	    ],
	    [
	      0.809017,
	      -0.406736642,
	      -0.978147626,
	      0.207911685,
	      -0.91354543,
	      -0.587785244
	    ],
	    [
	      0.777146,
	      -0.438371152,
	      -0.974370062,
	      0.224951059,
	      -0.898794055,
	      -0.629320383
	    ],
	    [
	      0.74314481,
	      -0.469471574,
	      -0.970295727,
	      0.241921902,
	      -0.882947564,
	      -0.669130623
	    ],
	    [
	      0.707106769,
	      -0.5,
	      -0.965925813,
	      0.258819044,
	      -0.866025388,
	      -0.707106769
	    ],
	    [
	      0.669130623,
	      -0.529919267,
	      -0.96126169,
	      0.275637358,
	      -0.848048091,
	      -0.74314481
	    ],
	    [
	      0.629320383,
	      -0.559192896,
	      -0.956304729,
	      0.29237169,
	      -0.829037547,
	      -0.777146
	    ],
	    [
	      0.587785244,
	      -0.587785244,
	      -0.95105654,
	      0.309017,
	      -0.809017,
	      -0.809017
	    ],
	    [
	      0.544639051,
	      -0.615661502,
	      -0.945518553,
	      0.325568169,
	      -0.788010776,
	      -0.838670552
	    ],
	    [
	      0.5,
	      -0.642787635,
	      -0.939692616,
	      0.342020154,
	      -0.766044438,
	      -0.866025388
	    ],
	    [
	      0.453990489,
	      -0.669130623,
	      -0.933580399,
	      0.35836795,
	      -0.74314481,
	      -0.891006529
	    ],
	    [
	      0.406736642,
	      -0.694658399,
	      -0.927183867,
	      0.37460658,
	      -0.719339788,
	      -0.91354543
	    ],
	    [
	      0.35836795,
	      -0.719339788,
	      -0.920504868,
	      0.390731126,
	      -0.694658399,
	      -0.933580399
	    ],
	    [
	      0.309017,
	      -0.74314481,
	      -0.91354543,
	      0.406736642,
	      -0.669130623,
	      -0.95105654
	    ],
	    [
	      0.258819044,
	      -0.766044438,
	      -0.906307817,
	      0.42261827,
	      -0.642787635,
	      -0.965925813
	    ],
	    [
	      0.207911685,
	      -0.788010776,
	      -0.898794055,
	      0.438371152,
	      -0.615661502,
	      -0.978147626
	    ],
	    [
	      0.156434461,
	      -0.809017,
	      -0.891006529,
	      0.453990489,
	      -0.587785244,
	      -0.987688363
	    ],
	    [
	      0.104528464,
	      -0.829037547,
	      -0.882947564,
	      0.469471574,
	      -0.559192896,
	      -0.994521916
	    ],
	    [
	      0.0523359552,
	      -0.848048091,
	      -0.874619722,
	      0.484809607,
	      -0.529919267,
	      -0.99862951
	    ],
	    [
	      6.123234e-16,
	      -0.866025388,
	      -0.866025388,
	      0.5,
	      -0.5,
	      -1
	    ],
	    [
	      -0.0523359552,
	      -0.882947564,
	      -0.857167304,
	      0.515038073,
	      -0.469471574,
	      -0.99862951
	    ],
	    [
	      -0.104528464,
	      -0.898794055,
	      -0.848048091,
	      0.529919267,
	      -0.438371152,
	      -0.994521916
	    ],
	    [
	      -0.156434461,
	      -0.91354543,
	      -0.838670552,
	      0.544639051,
	      -0.406736642,
	      -0.987688363
	    ],
	    [
	      -0.207911685,
	      -0.927183867,
	      -0.829037547,
	      0.559192896,
	      -0.37460658,
	      -0.978147626
	    ],
	    [
	      -0.258819044,
	      -0.939692616,
	      -0.819152057,
	      0.57357645,
	      -0.342020154,
	      -0.965925813
	    ],
	    [
	      -0.309017,
	      -0.95105654,
	      -0.809017,
	      0.587785244,
	      -0.309017,
	      -0.95105654
	    ],
	    [
	      -0.35836795,
	      -0.96126169,
	      -0.798635483,
	      0.601815045,
	      -0.275637358,
	      -0.933580399
	    ],
	    [
	      -0.406736642,
	      -0.970295727,
	      -0.788010776,
	      0.615661502,
	      -0.241921902,
	      -0.91354543
	    ],
	    [
	      -0.453990489,
	      -0.978147626,
	      -0.777146,
	      0.629320383,
	      -0.207911685,
	      -0.891006529
	    ],
	    [
	      -0.5,
	      -0.98480773,
	      -0.766044438,
	      0.642787635,
	      -0.173648179,
	      -0.866025388
	    ],
	    [
	      -0.544639051,
	      -0.990268052,
	      -0.754709601,
	      0.656059,
	      -0.139173105,
	      -0.838670552
	    ],
	    [
	      -0.587785244,
	      -0.994521916,
	      -0.74314481,
	      0.669130623,
	      -0.104528464,
	      -0.809017
	    ],
	    [
	      -0.629320383,
	      -0.997564077,
	      -0.7313537,
	      0.681998372,
	      -0.0697564706,
	      -0.777146
	    ],
	    [
	      -0.669130623,
	      -0.999390841,
	      -0.719339788,
	      0.694658399,
	      -0.0348994955,
	      -0.74314481
	    ],
	    [
	      -0.707106769,
	      -1,
	      -0.707106769,
	      0.707106769,
	      -4.28626385e-16,
	      -0.707106769
	    ],
	    [
	      -0.74314481,
	      -0.999390841,
	      -0.694658399,
	      0.719339788,
	      0.0348994955,
	      -0.669130623
	    ],
	    [
	      -0.777146,
	      -0.997564077,
	      -0.681998372,
	      0.7313537,
	      0.0697564706,
	      -0.629320383
	    ],
	    [
	      -0.809017,
	      -0.994521916,
	      -0.669130623,
	      0.74314481,
	      0.104528464,
	      -0.587785244
	    ],
	    [
	      -0.838670552,
	      -0.990268052,
	      -0.656059,
	      0.754709601,
	      0.139173105,
	      -0.544639051
	    ],
	    [
	      -0.866025388,
	      -0.98480773,
	      -0.642787635,
	      0.766044438,
	      0.173648179,
	      -0.5
	    ],
	    [
	      -0.891006529,
	      -0.978147626,
	      -0.629320383,
	      0.777146,
	      0.207911685,
	      -0.453990489
	    ],
	    [
	      -0.91354543,
	      -0.970295727,
	      -0.615661502,
	      0.788010776,
	      0.241921902,
	      -0.406736642
	    ],
	    [
	      -0.933580399,
	      -0.96126169,
	      -0.601815045,
	      0.798635483,
	      0.275637358,
	      -0.35836795
	    ],
	    [
	      -0.95105654,
	      -0.95105654,
	      -0.587785244,
	      0.809017,
	      0.309017,
	      -0.309017
	    ],
	    [
	      -0.965925813,
	      -0.939692616,
	      -0.57357645,
	      0.819152057,
	      0.342020154,
	      -0.258819044
	    ],
	    [
	      -0.978147626,
	      -0.927183867,
	      -0.559192896,
	      0.829037547,
	      0.37460658,
	      -0.207911685
	    ],
	    [
	      -0.987688363,
	      -0.91354543,
	      -0.544639051,
	      0.838670552,
	      0.406736642,
	      -0.156434461
	    ],
	    [
	      -0.994521916,
	      -0.898794055,
	      -0.529919267,
	      0.848048091,
	      0.438371152,
	      -0.104528464
	    ],
	    [
	      -0.99862951,
	      -0.882947564,
	      -0.515038073,
	      0.857167304,
	      0.469471574,
	      -0.0523359552
	    ],
	    [
	      -1,
	      -0.866025388,
	      -0.5,
	      0.866025388,
	      0.5,
	      -2.44991257e-15
	    ],
	    [
	      -0.99862951,
	      -0.848048091,
	      -0.484809607,
	      0.874619722,
	      0.529919267,
	      0.0523359552
	    ],
	    [
	      -0.994521916,
	      -0.829037547,
	      -0.469471574,
	      0.882947564,
	      0.559192896,
	      0.104528464
	    ],
	    [
	      -0.987688363,
	      -0.809017,
	      -0.453990489,
	      0.891006529,
	      0.587785244,
	      0.156434461
	    ],
	    [
	      -0.978147626,
	      -0.788010776,
	      -0.438371152,
	      0.898794055,
	      0.615661502,
	      0.207911685
	    ],
	    [
	      -0.965925813,
	      -0.766044438,
	      -0.42261827,
	      0.906307817,
	      0.642787635,
	      0.258819044
	    ],
	    [
	      -0.95105654,
	      -0.74314481,
	      -0.406736642,
	      0.91354543,
	      0.669130623,
	      0.309017
	    ],
	    [
	      -0.933580399,
	      -0.719339788,
	      -0.390731126,
	      0.920504868,
	      0.694658399,
	      0.35836795
	    ],
	    [
	      -0.91354543,
	      -0.694658399,
	      -0.37460658,
	      0.927183867,
	      0.719339788,
	      0.406736642
	    ],
	    [
	      -0.891006529,
	      -0.669130623,
	      -0.35836795,
	      0.933580399,
	      0.74314481,
	      0.453990489
	    ],
	    [
	      -0.866025388,
	      -0.642787635,
	      -0.342020154,
	      0.939692616,
	      0.766044438,
	      0.5
	    ],
	    [
	      -0.838670552,
	      -0.615661502,
	      -0.325568169,
	      0.945518553,
	      0.788010776,
	      0.544639051
	    ],
	    [
	      -0.809017,
	      -0.587785244,
	      -0.309017,
	      0.95105654,
	      0.809017,
	      0.587785244
	    ],
	    [
	      -0.777146,
	      -0.559192896,
	      -0.29237169,
	      0.956304729,
	      0.829037547,
	      0.629320383
	    ],
	    [
	      -0.74314481,
	      -0.529919267,
	      -0.275637358,
	      0.96126169,
	      0.848048091,
	      0.669130623
	    ],
	    [
	      -0.707106769,
	      -0.5,
	      -0.258819044,
	      0.965925813,
	      0.866025388,
	      0.707106769
	    ],
	    [
	      -0.669130623,
	      -0.469471574,
	      -0.241921902,
	      0.970295727,
	      0.882947564,
	      0.74314481
	    ],
	    [
	      -0.629320383,
	      -0.438371152,
	      -0.224951059,
	      0.974370062,
	      0.898794055,
	      0.777146
	    ],
	    [
	      -0.587785244,
	      -0.406736642,
	      -0.207911685,
	      0.978147626,
	      0.91354543,
	      0.809017
	    ],
	    [
	      -0.544639051,
	      -0.37460658,
	      -0.190809,
	      0.981627166,
	      0.927183867,
	      0.838670552
	    ],
	    [
	      -0.5,
	      -0.342020154,
	      -0.173648179,
	      0.98480773,
	      0.939692616,
	      0.866025388
	    ],
	    [
	      -0.453990489,
	      -0.309017,
	      -0.156434461,
	      0.987688363,
	      0.95105654,
	      0.891006529
	    ],
	    [
	      -0.406736642,
	      -0.275637358,
	      -0.139173105,
	      0.990268052,
	      0.96126169,
	      0.91354543
	    ],
	    [
	      -0.35836795,
	      -0.241921902,
	      -0.121869341,
	      0.992546141,
	      0.970295727,
	      0.933580399
	    ],
	    [
	      -0.309017,
	      -0.207911685,
	      -0.104528464,
	      0.994521916,
	      0.978147626,
	      0.95105654
	    ],
	    [
	      -0.258819044,
	      -0.173648179,
	      -0.0871557444,
	      0.99619472,
	      0.98480773,
	      0.965925813
	    ],
	    [
	      -0.207911685,
	      -0.139173105,
	      -0.0697564706,
	      0.997564077,
	      0.990268052,
	      0.978147626
	    ],
	    [
	      -0.156434461,
	      -0.104528464,
	      -0.0523359552,
	      0.99862951,
	      0.994521916,
	      0.987688363
	    ],
	    [
	      -0.104528464,
	      -0.0697564706,
	      -0.0348994955,
	      0.999390841,
	      0.997564077,
	      0.994521916
	    ],
	    [
	      -0.0523359552,
	      -0.0348994955,
	      -0.0174524058,
	      0.99984771,
	      0.999390841,
	      0.99862951
	    ]
	  ],
	  [
	    [
	      -1,
	      0,
	      1,
	      0,
	      0,
	      -1,
	      0,
	      0,
	      0
	    ],
	    [
	      -0.99984771,
	      0.0174524058,
	      0.99954313,
	      0.0302238502,
	      0.000263779628,
	      -0.99908632,
	      0.0427332148,
	      0.000589739357,
	      0.00000420248307
	    ],
	    [
	      -0.999390841,
	      0.0348994955,
	      0.998173058,
	      0.0604108796,
	      0.00105479721,
	      -0.996347725,
	      0.0853558108,
	      0.00235716137,
	      0.000033604505
	    ],
	    [
	      -0.99862951,
	      0.0523359552,
	      0.995891392,
	      0.0905243,
	      0.00237208884,
	      -0.991791308,
	      0.12775746,
	      0.00529688271,
	      0.000113328853
	    ],
	    [
	      -0.997564077,
	      0.0697564706,
	      0.992701054,
	      0.120527439,
	      0.00421405,
	      -0.985428751,
	      0.169828475,
	      0.00939994864,
	      0.000268345029
	    ],
	    [
	      -0.99619472,
	      0.0871557444,
	      0.988605797,
	      0.150383726,
	      0.00657843612,
	      -0.977276683,
	      0.211460009,
	      0.014653855,
	      0.000523393159
	    ],
	    [
	      -0.994521916,
	      0.104528464,
	      0.98361069,
	      0.18005681,
	      0.00946236681,
	      -0.967356,
	      0.252544463,
	      0.0210425854,
	      0.000902908447
	    ],
	    [
	      -0.992546141,
	      0.121869341,
	      0.97772181,
	      0.209510505,
	      0.0128623275,
	      -0.955692589,
	      0.292975664,
	      0.0285466593,
	      0.00143094664
	    ],
	    [
	      -0.990268052,
	      0.139173105,
	      0.970946252,
	      0.238708958,
	      0.0167741776,
	      -0.942316413,
	      0.33264932,
	      0.0371431746,
	      0.00213111029
	    ],
	    [
	      -0.987688363,
	      0.156434461,
	      0.96329236,
	      0.26761657,
	      0.0211931504,
	      -0.927262187,
	      0.37146312,
	      0.0468058847,
	      0.0030264766
	    ],
	    [
	      -0.98480773,
	      0.173648179,
	      0.954769492,
	      0.29619813,
	      0.0261138603,
	      -0.910568774,
	      0.409317106,
	      0.0575052574,
	      0.00413952675
	    ],
	    [
	      -0.981627166,
	      0.190809,
	      0.9453879,
	      0.324418813,
	      0.0315303169,
	      -0.892279327,
	      0.446113944,
	      0.0692085773,
	      0.00549207628
	    ],
	    [
	      -0.978147626,
	      0.207911685,
	      0.935159087,
	      0.352244258,
	      0.0374359153,
	      -0.872441,
	      0.481759191,
	      0.08188,
	      0.00710520707
	    ],
	    [
	      -0.974370062,
	      0.224951059,
	      0.924095511,
	      0.379640549,
	      0.043823462,
	      -0.851105,
	      0.516161561,
	      0.0954807103,
	      0.00899920426
	    ],
	    [
	      -0.970295727,
	      0.241921902,
	      0.912210703,
	      0.406574309,
	      0.0506851785,
	      -0.828326404,
	      0.549233,
	      0.10996896,
	      0.0111934906
	    ],
	    [
	      -0.965925813,
	      0.258819044,
	      0.899519,
	      0.433012694,
	      0.0580127,
	      -0.804163933,
	      0.580889285,
	      0.125300229,
	      0.0137065668
	    ],
	    [
	      -0.96126169,
	      0.275637358,
	      0.886036098,
	      0.458923548,
	      0.0657971054,
	      -0.778679788,
	      0.61104995,
	      0.141427353,
	      0.0165559556
	    ],
	    [
	      -0.956304729,
	      0.29237169,
	      0.87177819,
	      0.484275252,
	      0.0740289,
	      -0.751939535,
	      0.639638543,
	      0.158300623,
	      0.0197581388
	    ],
	    [
	      -0.95105654,
	      0.309017,
	      0.856762767,
	      0.509036958,
	      0.0826980695,
	      -0.724011958,
	      0.666583,
	      0.175867945,
	      0.0233285148
	    ],
	    [
	      -0.945518553,
	      0.325568169,
	      0.841008067,
	      0.533178449,
	      0.0917940363,
	      -0.694968879,
	      0.691815674,
	      0.194074973,
	      0.0272813439
	    ],
	    [
	      -0.939692616,
	      0.342020154,
	      0.824533343,
	      0.556670427,
	      0.101305731,
	      -0.664884746,
	      0.715273559,
	      0.212865278,
	      0.0316297
	    ],
	    [
	      -0.933580399,
	      0.35836795,
	      0.807358623,
	      0.579484105,
	      0.111221552,
	      -0.633836746,
	      0.736898482,
	      0.232180476,
	      0.0363854282
	    ],
	    [
	      -0.927183867,
	      0.37460658,
	      0.789504826,
	      0.601591825,
	      0.12152943,
	      -0.601904333,
	      0.756637275,
	      0.251960427,
	      0.0415591113
	    ],
	    [
	      -0.920504868,
	      0.390731126,
	      0.770993769,
	      0.622966528,
	      0.132216811,
	      -0.569169283,
	      0.774441898,
	      0.272143364,
	      0.0471600257
	    ],
	    [
	      -0.91354543,
	      0.406736642,
	      0.751848,
	      0.643582284,
	      0.143270656,
	      -0.535715163,
	      0.790269554,
	      0.292666078,
	      0.0531961136
	    ],
	    [
	      -0.906307817,
	      0.42261827,
	      0.732090712,
	      0.663413942,
	      0.154677495,
	      -0.501627326,
	      0.80408287,
	      0.313464135,
	      0.0596739501
	    ],
	    [
	      -0.898794055,
	      0.438371152,
	      0.711746097,
	      0.68243736,
	      0.16642347,
	      -0.466992587,
	      0.8158499,
	      0.334471971,
	      0.0665987208
	    ],
	    [
	      -0.891006529,
	      0.453990489,
	      0.690838933,
	      0.700629294,
	      0.178494215,
	      -0.431898981,
	      0.825544238,
	      0.355623156,
	      0.073974207
	    ],
	    [
	      -0.882947564,
	      0.469471574,
	      0.669394672,
	      0.71796757,
	      0.190875068,
	      -0.396435648,
	      0.833145082,
	      0.376850545,
	      0.0818027481
	    ],
	    [
	      -0.874619722,
	      0.484809607,
	      0.64743942,
	      0.734431207,
	      0.203550935,
	      -0.360692352,
	      0.838637531,
	      0.398086399,
	      0.0900852531
	    ],
	    [
	      -0.866025388,
	      0.5,
	      0.625,
	      0.75,
	      0.216506347,
	      -0.324759513,
	      0.842012107,
	      0.419262737,
	      0.0988211781
	    ],
	    [
	      -0.857167304,
	      0.515038073,
	      0.602103651,
	      0.764655054,
	      0.229725555,
	      -0.28872776,
	      0.843265295,
	      0.440311372,
	      0.108008519
	    ],
	    [
	      -0.848048091,
	      0.529919267,
	      0.578778386,
	      0.778378487,
	      0.243192434,
	      -0.252687752,
	      0.84239924,
	      0.461164147,
	      0.117643826
	    ],
	    [
	      -0.838670552,
	      0.544639051,
	      0.555052459,
	      0.79115355,
	      0.256890565,
	      -0.216729924,
	      0.839421868,
	      0.481753141,
	      0.127722174
	    ],
	    [
	      -0.829037547,
	      0.559192896,
	      0.530954957,
	      0.802964747,
	      0.270803303,
	      -0.180944279,
	      0.83434689,
	      0.502010882,
	      0.138237208
	    ],
	    [
	      -0.819152057,
	      0.57357645,
	      0.506515086,
	      0.813797653,
	      0.284913629,
	      -0.145420119,
	      0.827193558,
	      0.521870494,
	      0.149181142
	    ],
	    [
	      -0.809017,
	      0.587785244,
	      0.481762737,
	      0.823639095,
	      0.299204409,
	      -0.110245749,
	      0.817986846,
	      0.541265905,
	      0.160544738
	    ],
	    [
	      -0.798635483,
	      0.601815045,
	      0.456728,
	      0.832477033,
	      0.313658237,
	      -0.0755083486,
	      0.80675739,
	      0.560131907,
	      0.172317386
	    ],
	    [
	      -0.788010776,
	      0.615661502,
	      0.431441426,
	      0.840300739,
	      0.328257442,
	      -0.0412936322,
	      0.793541074,
	      0.578404605,
	      0.184487075
	    ],
	    [
	      -0.777146,
	      0.629320383,
	      0.405933768,
	      0.847100675,
	      0.342984289,
	      -0.00768567342,
	      0.778379381,
	      0.596021354,
	      0.197040468
	    ],
	    [
	      -0.766044438,
	      0.642787635,
	      0.380236119,
	      0.852868557,
	      0.357820839,
	      0.0252333339,
	      0.761319,
	      0.612921119,
	      0.209962875
	    ],
	    [
	      -0.754709601,
	      0.656059,
	      0.354379833,
	      0.857597291,
	      0.372748971,
	      0.0573833026,
	      0.742411554,
	      0.629044473,
	      0.223238334
	    ],
	    [
	      -0.74314481,
	      0.669130623,
	      0.32839635,
	      0.861281216,
	      0.387750536,
	      0.0886864737,
	      0.721713901,
	      0.64433378,
	      0.236849621
	    ],
	    [
	      -0.7313537,
	      0.681998372,
	      0.302317351,
	      0.863915801,
	      0.402807266,
	      0.119067609,
	      0.699287713,
	      0.658733487,
	      0.250778317
	    ],
	    [
	      -0.719339788,
	      0.694658399,
	      0.276174635,
	      0.865497828,
	      0.417900771,
	      0.148454204,
	      0.675199151,
	      0.672190368,
	      0.265004843
	    ],
	    [
	      -0.707106769,
	      0.707106769,
	      0.25,
	      0.866025388,
	      0.433012694,
	      0.176776692,
	      0.649519,
	      0.684653223,
	      0.279508501
	    ],
	    [
	      -0.694658399,
	      0.719339788,
	      0.22382538,
	      0.865497828,
	      0.448124617,
	      0.203968629,
	      0.622322381,
	      0.696073472,
	      0.294267476
	    ],
	    [
	      -0.681998372,
	      0.7313537,
	      0.197682649,
	      0.863915801,
	      0.463218153,
	      0.229966834,
	      0.593688309,
	      0.706405222,
	      0.309259027
	    ],
	    [
	      -0.669130623,
	      0.74314481,
	      0.17160365,
	      0.861281216,
	      0.478274852,
	      0.254711658,
	      0.563699722,
	      0.71560514,
	      0.324459404
	    ],
	    [
	      -0.656059,
	      0.754709601,
	      0.145620167,
	      0.857597291,
	      0.493276417,
	      0.278146982,
	      0.532443225,
	      0.723632872,
	      0.339844
	    ],
	    [
	      -0.642787635,
	      0.766044438,
	      0.119763866,
	      0.852868557,
	      0.508204579,
	      0.300220519,
	      0.500008881,
	      0.730451,
	      0.3553873
	    ],
	    [
	      -0.629320383,
	      0.777146,
	      0.0940662324,
	      0.847100675,
	      0.523041129,
	      0.32088393,
	      0.466489762,
	      0.736025095,
	      0.371063113
	    ],
	    [
	      -0.615661502,
	      0.788010776,
	      0.0685585812,
	      0.840300739,
	      0.537767947,
	      0.340092868,
	      0.431981891,
	      0.74032414,
	      0.386844516
	    ],
	    [
	      -0.601815045,
	      0.798635483,
	      0.0432719849,
	      0.832477033,
	      0.552367151,
	      0.35780713,
	      0.396583915,
	      0.743320107,
	      0.402703911
	    ],
	    [
	      -0.587785244,
	      0.809017,
	      0.0182372537,
	      0.823639095,
	      0.566821,
	      0.373990864,
	      0.360396802,
	      0.744988561,
	      0.418613225
	    ],
	    [
	      -0.57357645,
	      0.819152057,
	      -0.00651510758,
	      0.813797653,
	      0.581111789,
	      0.388612479,
	      0.323523581,
	      0.74530834,
	      0.434543818
	    ],
	    [
	      -0.559192896,
	      0.829037547,
	      -0.0309549458,
	      0.802964747,
	      0.595222116,
	      0.401644915,
	      0.286069185,
	      0.744261742,
	      0.450466663
	    ],
	    [
	      -0.544639051,
	      0.838670552,
	      -0.0550524816,
	      0.79115355,
	      0.609134853,
	      0.413065583,
	      0.248139873,
	      0.741834819,
	      0.466352403
	    ],
	    [
	      -0.529919267,
	      0.848048091,
	      -0.0787783638,
	      0.778378487,
	      0.622832954,
	      0.42285645,
	      0.209843263,
	      0.738016903,
	      0.482171416
	    ],
	    [
	      -0.515038073,
	      0.857167304,
	      -0.102103673,
	      0.764655054,
	      0.636299849,
	      0.431004167,
	      0.171287775,
	      0.732801199,
	      0.4978939
	    ],
	    [
	      -0.5,
	      0.866025388,
	      -0.125,
	      0.75,
	      0.649519,
	      0.4375,
	      0.132582515,
	      0.726184368,
	      0.513489902
	    ],
	    [
	      -0.484809607,
	      0.874619722,
	      -0.14743945,
	      0.734431207,
	      0.662474453,
	      0.442339838,
	      0.0938368812,
	      0.718166888,
	      0.528929472
	    ],
	    [
	      -0.469471574,
	      0.882947564,
	      -0.169394672,
	      0.71796757,
	      0.675150335,
	      0.445524335,
	      0.0551602542,
	      0.708752811,
	      0.544182777
	    ],
	    [
	      -0.453990489,
	      0.891006529,
	      -0.190838933,
	      0.700629294,
	      0.687531173,
	      0.447058767,
	      0.0166617651,
	      0.697949767,
	      0.559219956
	    ],
	    [
	      -0.438371152,
	      0.898794055,
	      -0.211746112,
	      0.68243736,
	      0.699601948,
	      0.446953058,
	      -0.0215500612,
	      0.6857692,
	      0.574011445
	    ],
	    [
	      -0.42261827,
	      0.906307817,
	      -0.232090712,
	      0.663413942,
	      0.711347878,
	      0.445221782,
	      -0.0593675859,
	      0.672226,
	      0.588528037
	    ],
	    [
	      -0.406736642,
	      0.91354543,
	      -0.251847953,
	      0.643582284,
	      0.722754776,
	      0.441884071,
	      -0.0966843441,
	      0.657338798,
	      0.602740645
	    ],
	    [
	      -0.390731126,
	      0.920504868,
	      -0.270993769,
	      0.622966528,
	      0.733808577,
	      0.436963588,
	      -0.133395374,
	      0.641129553,
	      0.616620898
	    ],
	    [
	      -0.37460658,
	      0.927183867,
	      -0.289504856,
	      0.601591825,
	      0.744496,
	      0.430488437,
	      -0.169397429,
	      0.623623908,
	      0.630140781
	    ],
	    [
	      -0.35836795,
	      0.933580399,
	      -0.307358623,
	      0.579484105,
	      0.754803836,
	      0.422491103,
	      -0.204589352,
	      0.604850829,
	      0.643272877
	    ],
	    [
	      -0.342020154,
	      0.939692616,
	      -0.324533343,
	      0.556670427,
	      0.764719665,
	      0.413008332,
	      -0.238872305,
	      0.584842563,
	      0.655990362
	    ],
	    [
	      -0.325568169,
	      0.945518553,
	      -0.341008067,
	      0.533178449,
	      0.774231374,
	      0.402081043,
	      -0.27215004,
	      0.563634634,
	      0.66826731
	    ],
	    [
	      -0.309017,
	      0.95105654,
	      -0.356762737,
	      0.509036958,
	      0.783327341,
	      0.389754236,
	      -0.304329157,
	      0.541265905,
	      0.680078387
	    ],
	    [
	      -0.29237169,
	      0.956304729,
	      -0.37177819,
	      0.484275252,
	      0.791996479,
	      0.376076847,
	      -0.3353194,
	      0.517778039,
	      0.691399336
	    ],
	    [
	      -0.275637358,
	      0.96126169,
	      -0.386036068,
	      0.458923548,
	      0.800228298,
	      0.361101508,
	      -0.365033895,
	      0.493215799,
	      0.702206612
	    ],
	    [
	      -0.258819044,
	      0.965925813,
	      -0.399519056,
	      0.433012694,
	      0.808012724,
	      0.344884604,
	      -0.393389285,
	      0.46762684,
	      0.712477803
	    ],
	    [
	      -0.241921902,
	      0.970295727,
	      -0.412210703,
	      0.406574309,
	      0.815340221,
	      0.327485919,
	      -0.420306176,
	      0.441061407,
	      0.722191513
	    ],
	    [
	      -0.224951059,
	      0.974370062,
	      -0.424095541,
	      0.379640549,
	      0.822201967,
	      0.308968604,
	      -0.445709109,
	      0.413572371,
	      0.731327355
	    ],
	    [
	      -0.207911685,
	      0.978147626,
	      -0.435159087,
	      0.352244258,
	      0.828589499,
	      0.289398909,
	      -0.469526976,
	      0.385215133,
	      0.739866197
	    ],
	    [
	      -0.190809,
	      0.981627166,
	      -0.4453879,
	      0.324418813,
	      0.834495068,
	      0.268846035,
	      -0.491693079,
	      0.356047243,
	      0.747790158
	    ],
	    [
	      -0.173648179,
	      0.98480773,
	      -0.454769462,
	      0.29619813,
	      0.83991152,
	      0.24738194,
	      -0.51214534,
	      0.326128513,
	      0.755082488
	    ],
	    [
	      -0.156434461,
	      0.987688363,
	      -0.46329239,
	      0.26761657,
	      0.844832242,
	      0.225081131,
	      -0.530826509,
	      0.295520723,
	      0.76172775
	    ],
	    [
	      -0.139173105,
	      0.990268052,
	      -0.470946282,
	      0.238708958,
	      0.849251211,
	      0.202020496,
	      -0.547684371,
	      0.264287412,
	      0.767712
	    ],
	    [
	      -0.121869341,
	      0.992546141,
	      -0.477721781,
	      0.209510505,
	      0.853163064,
	      0.178278968,
	      -0.562671661,
	      0.232493877,
	      0.773022532
	    ],
	    [
	      -0.104528464,
	      0.994521916,
	      -0.48361069,
	      0.18005681,
	      0.856563032,
	      0.153937444,
	      -0.575746536,
	      0.200206831,
	      0.777648
	    ],
	    [
	      -0.0871557444,
	      0.99619472,
	      -0.488605827,
	      0.150383726,
	      0.859446943,
	      0.129078493,
	      -0.586872399,
	      0.167494327,
	      0.78157866
	    ],
	    [
	      -0.0697564706,
	      0.997564077,
	      -0.492701054,
	      0.120527439,
	      0.86181134,
	      0.103786126,
	      -0.596018076,
	      0.134425521,
	      0.784806132
	    ],
	    [
	      -0.0523359552,
	      0.99862951,
	      -0.495891422,
	      0.0905243,
	      0.863653302,
	      0.0781455562,
	      -0.603158116,
	      0.101070546,
	      0.787323534
	    ],
	    [
	      -0.0348994955,
	      0.999390841,
	      -0.498173028,
	      0.0604108796,
	      0.864970624,
	      0.0522429794,
	      -0.608272374,
	      0.0675002709,
	      0.789125502
	    ],
	    [
	      -0.0174524058,
	      0.99984771,
	      -0.49954313,
	      0.0302238502,
	      0.865761638,
	      0.0261653196,
	      -0.611346722,
	      0.0337861441,
	      0.79020822
	    ],
	    [
	      0,
	      1,
	      -0.5,
	      0,
	      0.866025388,
	      0,
	      -0.612372458,
	      0,
	      0.790569425
	    ],
	    [
	      0.0174524058,
	      0.99984771,
	      -0.49954313,
	      -0.0302238502,
	      0.865761638,
	      -0.0261653196,
	      -0.611346722,
	      -0.0337861441,
	      0.79020822
	    ],
	    [
	      0.0348994955,
	      0.999390841,
	      -0.498173028,
	      -0.0604108796,
	      0.864970624,
	      -0.0522429794,
	      -0.608272374,
	      -0.0675002709,
	      0.789125502
	    ],
	    [
	      0.0523359552,
	      0.99862951,
	      -0.495891422,
	      -0.0905243,
	      0.863653302,
	      -0.0781455562,
	      -0.603158116,
	      -0.101070546,
	      0.787323534
	    ],
	    [
	      0.0697564706,
	      0.997564077,
	      -0.492701054,
	      -0.120527439,
	      0.86181134,
	      -0.103786126,
	      -0.596018076,
	      -0.134425521,
	      0.784806132
	    ],
	    [
	      0.0871557444,
	      0.99619472,
	      -0.488605827,
	      -0.150383726,
	      0.859446943,
	      -0.129078493,
	      -0.586872399,
	      -0.167494327,
	      0.78157866
	    ],
	    [
	      0.104528464,
	      0.994521916,
	      -0.48361069,
	      -0.18005681,
	      0.856563032,
	      -0.153937444,
	      -0.575746536,
	      -0.200206831,
	      0.777648
	    ],
	    [
	      0.121869341,
	      0.992546141,
	      -0.477721781,
	      -0.209510505,
	      0.853163064,
	      -0.178278968,
	      -0.562671661,
	      -0.232493877,
	      0.773022532
	    ],
	    [
	      0.139173105,
	      0.990268052,
	      -0.470946282,
	      -0.238708958,
	      0.849251211,
	      -0.202020496,
	      -0.547684371,
	      -0.264287412,
	      0.767712
	    ],
	    [
	      0.156434461,
	      0.987688363,
	      -0.46329239,
	      -0.26761657,
	      0.844832242,
	      -0.225081131,
	      -0.530826509,
	      -0.295520723,
	      0.76172775
	    ],
	    [
	      0.173648179,
	      0.98480773,
	      -0.454769462,
	      -0.29619813,
	      0.83991152,
	      -0.24738194,
	      -0.51214534,
	      -0.326128513,
	      0.755082488
	    ],
	    [
	      0.190809,
	      0.981627166,
	      -0.4453879,
	      -0.324418813,
	      0.834495068,
	      -0.268846035,
	      -0.491693079,
	      -0.356047243,
	      0.747790158
	    ],
	    [
	      0.207911685,
	      0.978147626,
	      -0.435159087,
	      -0.352244258,
	      0.828589499,
	      -0.289398909,
	      -0.469526976,
	      -0.385215133,
	      0.739866197
	    ],
	    [
	      0.224951059,
	      0.974370062,
	      -0.424095541,
	      -0.379640549,
	      0.822201967,
	      -0.308968604,
	      -0.445709109,
	      -0.413572371,
	      0.731327355
	    ],
	    [
	      0.241921902,
	      0.970295727,
	      -0.412210703,
	      -0.406574309,
	      0.815340221,
	      -0.327485919,
	      -0.420306176,
	      -0.441061407,
	      0.722191513
	    ],
	    [
	      0.258819044,
	      0.965925813,
	      -0.399519056,
	      -0.433012694,
	      0.808012724,
	      -0.344884604,
	      -0.393389285,
	      -0.46762684,
	      0.712477803
	    ],
	    [
	      0.275637358,
	      0.96126169,
	      -0.386036068,
	      -0.458923548,
	      0.800228298,
	      -0.361101508,
	      -0.365033895,
	      -0.493215799,
	      0.702206612
	    ],
	    [
	      0.29237169,
	      0.956304729,
	      -0.37177819,
	      -0.484275252,
	      0.791996479,
	      -0.376076847,
	      -0.3353194,
	      -0.517778039,
	      0.691399336
	    ],
	    [
	      0.309017,
	      0.95105654,
	      -0.356762737,
	      -0.509036958,
	      0.783327341,
	      -0.389754236,
	      -0.304329157,
	      -0.541265905,
	      0.680078387
	    ],
	    [
	      0.325568169,
	      0.945518553,
	      -0.341008067,
	      -0.533178449,
	      0.774231374,
	      -0.402081043,
	      -0.27215004,
	      -0.563634634,
	      0.66826731
	    ],
	    [
	      0.342020154,
	      0.939692616,
	      -0.324533343,
	      -0.556670427,
	      0.764719665,
	      -0.413008332,
	      -0.238872305,
	      -0.584842563,
	      0.655990362
	    ],
	    [
	      0.35836795,
	      0.933580399,
	      -0.307358623,
	      -0.579484105,
	      0.754803836,
	      -0.422491103,
	      -0.204589352,
	      -0.604850829,
	      0.643272877
	    ],
	    [
	      0.37460658,
	      0.927183867,
	      -0.289504856,
	      -0.601591825,
	      0.744496,
	      -0.430488437,
	      -0.169397429,
	      -0.623623908,
	      0.630140781
	    ],
	    [
	      0.390731126,
	      0.920504868,
	      -0.270993769,
	      -0.622966528,
	      0.733808577,
	      -0.436963588,
	      -0.133395374,
	      -0.641129553,
	      0.616620898
	    ],
	    [
	      0.406736642,
	      0.91354543,
	      -0.251847953,
	      -0.643582284,
	      0.722754776,
	      -0.441884071,
	      -0.0966843441,
	      -0.657338798,
	      0.602740645
	    ],
	    [
	      0.42261827,
	      0.906307817,
	      -0.232090712,
	      -0.663413942,
	      0.711347878,
	      -0.445221782,
	      -0.0593675859,
	      -0.672226,
	      0.588528037
	    ],
	    [
	      0.438371152,
	      0.898794055,
	      -0.211746112,
	      -0.68243736,
	      0.699601948,
	      -0.446953058,
	      -0.0215500612,
	      -0.6857692,
	      0.574011445
	    ],
	    [
	      0.453990489,
	      0.891006529,
	      -0.190838933,
	      -0.700629294,
	      0.687531173,
	      -0.447058767,
	      0.0166617651,
	      -0.697949767,
	      0.559219956
	    ],
	    [
	      0.469471574,
	      0.882947564,
	      -0.169394672,
	      -0.71796757,
	      0.675150335,
	      -0.445524335,
	      0.0551602542,
	      -0.708752811,
	      0.544182777
	    ],
	    [
	      0.484809607,
	      0.874619722,
	      -0.14743945,
	      -0.734431207,
	      0.662474453,
	      -0.442339838,
	      0.0938368812,
	      -0.718166888,
	      0.528929472
	    ],
	    [
	      0.5,
	      0.866025388,
	      -0.125,
	      -0.75,
	      0.649519,
	      -0.4375,
	      0.132582515,
	      -0.726184368,
	      0.513489902
	    ],
	    [
	      0.515038073,
	      0.857167304,
	      -0.102103673,
	      -0.764655054,
	      0.636299849,
	      -0.431004167,
	      0.171287775,
	      -0.732801199,
	      0.4978939
	    ],
	    [
	      0.529919267,
	      0.848048091,
	      -0.0787783638,
	      -0.778378487,
	      0.622832954,
	      -0.42285645,
	      0.209843263,
	      -0.738016903,
	      0.482171416
	    ],
	    [
	      0.544639051,
	      0.838670552,
	      -0.0550524816,
	      -0.79115355,
	      0.609134853,
	      -0.413065583,
	      0.248139873,
	      -0.741834819,
	      0.466352403
	    ],
	    [
	      0.559192896,
	      0.829037547,
	      -0.0309549458,
	      -0.802964747,
	      0.595222116,
	      -0.401644915,
	      0.286069185,
	      -0.744261742,
	      0.450466663
	    ],
	    [
	      0.57357645,
	      0.819152057,
	      -0.00651510758,
	      -0.813797653,
	      0.581111789,
	      -0.388612479,
	      0.323523581,
	      -0.74530834,
	      0.434543818
	    ],
	    [
	      0.587785244,
	      0.809017,
	      0.0182372537,
	      -0.823639095,
	      0.566821,
	      -0.373990864,
	      0.360396802,
	      -0.744988561,
	      0.418613225
	    ],
	    [
	      0.601815045,
	      0.798635483,
	      0.0432719849,
	      -0.832477033,
	      0.552367151,
	      -0.35780713,
	      0.396583915,
	      -0.743320107,
	      0.402703911
	    ],
	    [
	      0.615661502,
	      0.788010776,
	      0.0685585812,
	      -0.840300739,
	      0.537767947,
	      -0.340092868,
	      0.431981891,
	      -0.74032414,
	      0.386844516
	    ],
	    [
	      0.629320383,
	      0.777146,
	      0.0940662324,
	      -0.847100675,
	      0.523041129,
	      -0.32088393,
	      0.466489762,
	      -0.736025095,
	      0.371063113
	    ],
	    [
	      0.642787635,
	      0.766044438,
	      0.119763866,
	      -0.852868557,
	      0.508204579,
	      -0.300220519,
	      0.500008881,
	      -0.730451,
	      0.3553873
	    ],
	    [
	      0.656059,
	      0.754709601,
	      0.145620167,
	      -0.857597291,
	      0.493276417,
	      -0.278146982,
	      0.532443225,
	      -0.723632872,
	      0.339844
	    ],
	    [
	      0.669130623,
	      0.74314481,
	      0.17160365,
	      -0.861281216,
	      0.478274852,
	      -0.254711658,
	      0.563699722,
	      -0.71560514,
	      0.324459404
	    ],
	    [
	      0.681998372,
	      0.7313537,
	      0.197682649,
	      -0.863915801,
	      0.463218153,
	      -0.229966834,
	      0.593688309,
	      -0.706405222,
	      0.309259027
	    ],
	    [
	      0.694658399,
	      0.719339788,
	      0.22382538,
	      -0.865497828,
	      0.448124617,
	      -0.203968629,
	      0.622322381,
	      -0.696073472,
	      0.294267476
	    ],
	    [
	      0.707106769,
	      0.707106769,
	      0.25,
	      -0.866025388,
	      0.433012694,
	      -0.176776692,
	      0.649519,
	      -0.684653223,
	      0.279508501
	    ],
	    [
	      0.719339788,
	      0.694658399,
	      0.276174635,
	      -0.865497828,
	      0.417900771,
	      -0.148454204,
	      0.675199151,
	      -0.672190368,
	      0.265004843
	    ],
	    [
	      0.7313537,
	      0.681998372,
	      0.302317351,
	      -0.863915801,
	      0.402807266,
	      -0.119067609,
	      0.699287713,
	      -0.658733487,
	      0.250778317
	    ],
	    [
	      0.74314481,
	      0.669130623,
	      0.32839635,
	      -0.861281216,
	      0.387750536,
	      -0.0886864737,
	      0.721713901,
	      -0.64433378,
	      0.236849621
	    ],
	    [
	      0.754709601,
	      0.656059,
	      0.354379833,
	      -0.857597291,
	      0.372748971,
	      -0.0573833026,
	      0.742411554,
	      -0.629044473,
	      0.223238334
	    ],
	    [
	      0.766044438,
	      0.642787635,
	      0.380236119,
	      -0.852868557,
	      0.357820839,
	      -0.0252333339,
	      0.761319,
	      -0.612921119,
	      0.209962875
	    ],
	    [
	      0.777146,
	      0.629320383,
	      0.405933768,
	      -0.847100675,
	      0.342984289,
	      0.00768567342,
	      0.778379381,
	      -0.596021354,
	      0.197040468
	    ],
	    [
	      0.788010776,
	      0.615661502,
	      0.431441426,
	      -0.840300739,
	      0.328257442,
	      0.0412936322,
	      0.793541074,
	      -0.578404605,
	      0.184487075
	    ],
	    [
	      0.798635483,
	      0.601815045,
	      0.456728,
	      -0.832477033,
	      0.313658237,
	      0.0755083486,
	      0.80675739,
	      -0.560131907,
	      0.172317386
	    ],
	    [
	      0.809017,
	      0.587785244,
	      0.481762737,
	      -0.823639095,
	      0.299204409,
	      0.110245749,
	      0.817986846,
	      -0.541265905,
	      0.160544738
	    ],
	    [
	      0.819152057,
	      0.57357645,
	      0.506515086,
	      -0.813797653,
	      0.284913629,
	      0.145420119,
	      0.827193558,
	      -0.521870494,
	      0.149181142
	    ],
	    [
	      0.829037547,
	      0.559192896,
	      0.530954957,
	      -0.802964747,
	      0.270803303,
	      0.180944279,
	      0.83434689,
	      -0.502010882,
	      0.138237208
	    ],
	    [
	      0.838670552,
	      0.544639051,
	      0.555052459,
	      -0.79115355,
	      0.256890565,
	      0.216729924,
	      0.839421868,
	      -0.481753141,
	      0.127722174
	    ],
	    [
	      0.848048091,
	      0.529919267,
	      0.578778386,
	      -0.778378487,
	      0.243192434,
	      0.252687752,
	      0.84239924,
	      -0.461164147,
	      0.117643826
	    ],
	    [
	      0.857167304,
	      0.515038073,
	      0.602103651,
	      -0.764655054,
	      0.229725555,
	      0.28872776,
	      0.843265295,
	      -0.440311372,
	      0.108008519
	    ],
	    [
	      0.866025388,
	      0.5,
	      0.625,
	      -0.75,
	      0.216506347,
	      0.324759513,
	      0.842012107,
	      -0.419262737,
	      0.0988211781
	    ],
	    [
	      0.874619722,
	      0.484809607,
	      0.64743942,
	      -0.734431207,
	      0.203550935,
	      0.360692352,
	      0.838637531,
	      -0.398086399,
	      0.0900852531
	    ],
	    [
	      0.882947564,
	      0.469471574,
	      0.669394672,
	      -0.71796757,
	      0.190875068,
	      0.396435648,
	      0.833145082,
	      -0.376850545,
	      0.0818027481
	    ],
	    [
	      0.891006529,
	      0.453990489,
	      0.690838933,
	      -0.700629294,
	      0.178494215,
	      0.431898981,
	      0.825544238,
	      -0.355623156,
	      0.073974207
	    ],
	    [
	      0.898794055,
	      0.438371152,
	      0.711746097,
	      -0.68243736,
	      0.16642347,
	      0.466992587,
	      0.8158499,
	      -0.334471971,
	      0.0665987208
	    ],
	    [
	      0.906307817,
	      0.42261827,
	      0.732090712,
	      -0.663413942,
	      0.154677495,
	      0.501627326,
	      0.80408287,
	      -0.313464135,
	      0.0596739501
	    ],
	    [
	      0.91354543,
	      0.406736642,
	      0.751848,
	      -0.643582284,
	      0.143270656,
	      0.535715163,
	      0.790269554,
	      -0.292666078,
	      0.0531961136
	    ],
	    [
	      0.920504868,
	      0.390731126,
	      0.770993769,
	      -0.622966528,
	      0.132216811,
	      0.569169283,
	      0.774441898,
	      -0.272143364,
	      0.0471600257
	    ],
	    [
	      0.927183867,
	      0.37460658,
	      0.789504826,
	      -0.601591825,
	      0.12152943,
	      0.601904333,
	      0.756637275,
	      -0.251960427,
	      0.0415591113
	    ],
	    [
	      0.933580399,
	      0.35836795,
	      0.807358623,
	      -0.579484105,
	      0.111221552,
	      0.633836746,
	      0.736898482,
	      -0.232180476,
	      0.0363854282
	    ],
	    [
	      0.939692616,
	      0.342020154,
	      0.824533343,
	      -0.556670427,
	      0.101305731,
	      0.664884746,
	      0.715273559,
	      -0.212865278,
	      0.0316297
	    ],
	    [
	      0.945518553,
	      0.325568169,
	      0.841008067,
	      -0.533178449,
	      0.0917940363,
	      0.694968879,
	      0.691815674,
	      -0.194074973,
	      0.0272813439
	    ],
	    [
	      0.95105654,
	      0.309017,
	      0.856762767,
	      -0.509036958,
	      0.0826980695,
	      0.724011958,
	      0.666583,
	      -0.175867945,
	      0.0233285148
	    ],
	    [
	      0.956304729,
	      0.29237169,
	      0.87177819,
	      -0.484275252,
	      0.0740289,
	      0.751939535,
	      0.639638543,
	      -0.158300623,
	      0.0197581388
	    ],
	    [
	      0.96126169,
	      0.275637358,
	      0.886036098,
	      -0.458923548,
	      0.0657971054,
	      0.778679788,
	      0.61104995,
	      -0.141427353,
	      0.0165559556
	    ],
	    [
	      0.965925813,
	      0.258819044,
	      0.899519,
	      -0.433012694,
	      0.0580127,
	      0.804163933,
	      0.580889285,
	      -0.125300229,
	      0.0137065668
	    ],
	    [
	      0.970295727,
	      0.241921902,
	      0.912210703,
	      -0.406574309,
	      0.0506851785,
	      0.828326404,
	      0.549233,
	      -0.10996896,
	      0.0111934906
	    ],
	    [
	      0.974370062,
	      0.224951059,
	      0.924095511,
	      -0.379640549,
	      0.043823462,
	      0.851105,
	      0.516161561,
	      -0.0954807103,
	      0.00899920426
	    ],
	    [
	      0.978147626,
	      0.207911685,
	      0.935159087,
	      -0.352244258,
	      0.0374359153,
	      0.872441,
	      0.481759191,
	      -0.08188,
	      0.00710520707
	    ],
	    [
	      0.981627166,
	      0.190809,
	      0.9453879,
	      -0.324418813,
	      0.0315303169,
	      0.892279327,
	      0.446113944,
	      -0.0692085773,
	      0.00549207628
	    ],
	    [
	      0.98480773,
	      0.173648179,
	      0.954769492,
	      -0.29619813,
	      0.0261138603,
	      0.910568774,
	      0.409317106,
	      -0.0575052574,
	      0.00413952675
	    ],
	    [
	      0.987688363,
	      0.156434461,
	      0.96329236,
	      -0.26761657,
	      0.0211931504,
	      0.927262187,
	      0.37146312,
	      -0.0468058847,
	      0.0030264766
	    ],
	    [
	      0.990268052,
	      0.139173105,
	      0.970946252,
	      -0.238708958,
	      0.0167741776,
	      0.942316413,
	      0.33264932,
	      -0.0371431746,
	      0.00213111029
	    ],
	    [
	      0.992546141,
	      0.121869341,
	      0.97772181,
	      -0.209510505,
	      0.0128623275,
	      0.955692589,
	      0.292975664,
	      -0.0285466593,
	      0.00143094664
	    ],
	    [
	      0.994521916,
	      0.104528464,
	      0.98361069,
	      -0.18005681,
	      0.00946236681,
	      0.967356,
	      0.252544463,
	      -0.0210425854,
	      0.000902908447
	    ],
	    [
	      0.99619472,
	      0.0871557444,
	      0.988605797,
	      -0.150383726,
	      0.00657843612,
	      0.977276683,
	      0.211460009,
	      -0.014653855,
	      0.000523393159
	    ],
	    [
	      0.997564077,
	      0.0697564706,
	      0.992701054,
	      -0.120527439,
	      0.00421405,
	      0.985428751,
	      0.169828475,
	      -0.00939994864,
	      0.000268345029
	    ],
	    [
	      0.99862951,
	      0.0523359552,
	      0.995891392,
	      -0.0905243,
	      0.00237208884,
	      0.991791308,
	      0.12775746,
	      -0.00529688271,
	      0.000113328853
	    ],
	    [
	      0.999390841,
	      0.0348994955,
	      0.998173058,
	      -0.0604108796,
	      0.00105479721,
	      0.996347725,
	      0.0853558108,
	      -0.00235716137,
	      0.000033604505
	    ],
	    [
	      0.99984771,
	      0.0174524058,
	      0.99954313,
	      -0.0302238502,
	      0.000263779628,
	      0.99908632,
	      0.0427332148,
	      -0.000589739357,
	      0.00000420248307
	    ],
	    [
	      1,
	      0,
	      1,
	      0,
	      0,
	      1,
	      0,
	      0,
	      0
	    ]
	  ]
	]

	/**
	 * Pre-computed per-band weighting coefficients for producing energy-preserving
	 * Max-Re sources.
	 */
	exports.MAX_RE_WEIGHTS =
	[
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1,
	    1,
	    1,
	    1
	  ],
	  [
	    1.0032358508264159,
	    1.0021561078918704,
	    0.9991522721291044,
	    0.9900383346072376
	  ],
	  [
	    1.0323700100887403,
	    1.0211943511980661,
	    0.9904327224316126,
	    0.8985721355692946
	  ],
	  [
	    1.0626941200192837,
	    1.0402306944670838,
	    0.9791614098092954,
	    0.7998060308998676
	  ],
	  [
	    1.093999484738735,
	    1.0589537676973442,
	    0.9649762040494918,
	    0.6936032566684466
	  ],
	  [
	    1.126003037274403,
	    1.07700551504534,
	    0.9475255978805139,
	    0.5798903526486952
	  ],
	  [
	    1.1583454003572016,
	    1.0939820685450519,
	    0.9264740556372181,
	    0.45868998779583786
	  ],
	  [
	    1.1905904804789895,
	    1.1094372633297156,
	    0.9015119456269705,
	    0.3301577214839965
	  ],
	  [
	    1.2222283958622953,
	    1.1228901205544772,
	    0.8723701036428401,
	    0.19462053205464802
	  ],
	  [
	    1.2526836221434745,
	    1.133837499964763,
	    0.8388386006370375,
	    0.05261359862069929
	  ],
	  [
	    1.2819868322954973,
	    1.1423579695609207,
	    0.8011990403743167,
	    0
	  ],
	  [
	    1.3120731774625924,
	    1.1502068820580456,
	    0.7608388127738076,
	    0
	  ],
	  [
	    1.3430111799785607,
	    1.1574235943837505,
	    0.7177992282271877,
	    0
	  ],
	  [
	    1.3746490959476585,
	    1.1638590665453323,
	    0.6719991769885592,
	    0
	  ],
	  [
	    1.4068092926157594,
	    1.169353858964783,
	    0.623371324575326,
	    0
	  ],
	  [
	    1.4392864456039072,
	    1.1737388805087106,
	    0.5718675889451592,
	    0
	  ],
	  [
	    1.4718463517337337,
	    1.1768368967674447,
	    0.5174653413254887,
	    0
	  ],
	  [
	    1.504225711759235,
	    1.1784649619355996,
	    0.46017412651086853,
	    0
	  ],
	  [
	    1.536133251152103,
	    1.1784379039770327,
	    0.4000425964751542,
	    0
	  ],
	  [
	    1.5672525304852498,
	    1.1765729330887034,
	    0.337165236956795,
	    0
	  ],
	  [
	    1.597246736017093,
	    1.1726953538047915,
	    0.2716883543809124,
	    0
	  ],
	  [
	    1.6257656244041108,
	    1.166645241810761,
	    0.20381470052203146,
	    0
	  ],
	  [
	    1.6524546183065816,
	    1.1582848047410574,
	    0.13380606994103852,
	    0
	  ],
	  [
	    1.6769658184075504,
	    1.1475059972026487,
	    0.06198323662199352,
	    0
	  ],
	  [
	    1.6990056332515058,
	    1.1342613270635011,
	    0,
	    0
	  ],
	  [
	    1.7202240662101795,
	    1.1197885940495649,
	    0,
	    0
	  ],
	  [
	    1.7416307545362066,
	    1.1048097178834912,
	    0,
	    0
	  ],
	  [
	    1.763183172521712,
	    1.089329779471421,
	    0,
	    0
	  ],
	  [
	    1.784837323932529,
	    1.0733560490248248,
	    0,
	    0
	  ],
	  [
	    1.8065479282674715,
	    1.0568981278169443,
	    0,
	    0
	  ],
	  [
	    1.828268651081558,
	    1.03996806565619,
	    0,
	    0
	  ],
	  [
	    1.8499523757324718,
	    1.022580450054847,
	    0,
	    0
	  ],
	  [
	    1.8715515126303635,
	    1.00475246342061,
	    0,
	    0
	  ],
	  [
	    1.8930183408427133,
	    0.9865039050945279,
	    0,
	    0
	  ],
	  [
	    1.9143053757711086,
	    0.9678571757036307,
	    0,
	    0
	  ],
	  [
	    1.9353657556228374,
	    0.9488372220817789,
	    0,
	    0
	  ],
	  [
	    1.956153638595801,
	    0.9294714419199109,
	    0,
	    0
	  ],
	  [
	    1.9766246021256129,
	    0.9097895483090511,
	    0,
	    0
	  ],
	  [
	    1.9967360352468466,
	    0.8898233953998222,
	    0,
	    0
	  ],
	  [
	    2.0164475151228762,
	    0.8696067674779677,
	    0,
	    0
	  ],
	  [
	    2.035721159113243,
	    0.8491751347995677,
	    0,
	    0
	  ],
	  [
	    2.0545219443702267,
	    0.8285653804943943,
	    0,
	    0
	  ],
	  [
	    2.0728179878669346,
	    0.8078155036854582,
	    0,
	    0
	  ],
	  [
	    2.090580780920932,
	    0.7869643046470761,
	    0,
	    0
	  ],
	  [
	    2.1077853736394316,
	    0.7660510583007786,
	    0,
	    0
	  ],
	  [
	    2.124410506212585,
	    0.7451151826066895,
	    0,
	    0
	  ],
	  [
	    2.1404386855518256,
	    0.724195908438217,
	    0,
	    0
	  ],
	  [
	    2.155856207339799,
	    0.7033319573330264,
	    0,
	    0
	  ],
	  [
	    2.1706531250587875,
	    0.6825612331082543,
	    0,
	    0
	  ],
	  [
	    2.184823168934199,
	    0.6619205327382505,
	    0,
	    0
	  ],
	  [
	    2.198363618917445,
	    0.6414452811527926,
	    0,
	    0
	  ],
	  [
	    2.2112751368000905,
	    0.6211692937622493,
	    0,
	    0
	  ],
	  [
	    2.223561563274568,
	    0.6011245695963112,
	    0,
	    0
	  ],
	  [
	    2.2352296862266203,
	    0.5813411169971875,
	    0,
	    0
	  ],
	  [
	    2.2462889867652436,
	    0.5618468128767999,
	    0,
	    0
	  ],
	  [
	    2.2567513694835313,
	    0.542667295665886,
	    0,
	    0
	  ],
	  [
	    2.2666308832243236,
	    0.5238258912804311,
	    0,
	    0
	  ],
	  [
	    2.275943438230698,
	    0.5053435707295075,
	    0,
	    0
	  ],
	  [
	    2.284706525029858,
	    0.4872389374032205,
	    0,
	    0
	  ],
	  [
	    2.2929389397681375,
	    0.46952824161738976,
	    0,
	    0
	  ],
	  [
	    2.30066052002182,
	    0.4522254196537687,
	    0,
	    0
	  ],
	  [
	    2.3078918943878133,
	    0.4353421543162538,
	    0,
	    0
	  ],
	  [
	    2.3146542484400614,
	    0.4188879539154533,
	    0,
	    0
	  ],
	  [
	    2.3209691089472178,
	    0.402870246583764,
	    0,
	    0
	  ],
	  [
	    2.3268581476041734,
	    0.38729448689625284,
	    0,
	    0
	  ],
	  [
	    2.3323430049489864,
	    0.37216427191375173,
	    0,
	    0
	  ],
	  [
	    2.3374451346266376,
	    0.3574814639581776,
	    0,
	    0
	  ],
	  [
	    2.34218566772664,
	    0.34324631766145536,
	    0,
	    0
	  ],
	  [
	    2.346585296563553,
	    0.3294576090850418,
	    0,
	    0
	  ],
	  [
	    2.3506641769856538,
	    0.3161127649750473,
	    0,
	    0
	  ],
	  [
	    2.3544418480826557,
	    0.3032079904882719,
	    0,
	    0
	  ],
	  [
	    2.357937168012265,
	    0.2907383939888871,
	    0,
	    0
	  ],
	  [
	    2.3611682645700416,
	    0.27869810776764853,
	    0,
	    0
	  ],
	  [
	    2.36415249907986,
	    0.26708040377071157,
	    0,
	    0
	  ],
	  [
	    2.366906442175269,
	    0.2558778036401838,
	    0,
	    0
	  ],
	  [
	    2.3694458600677306,
	    0.24508218256159103,
	    0,
	    0
	  ],
	  [
	    2.371785709949025,
	    0.2346848665837075,
	    0,
	    0
	  ],
	  [
	    2.3739401432456417,
	    0.22467672322375193,
	    0,
	    0
	  ],
	  [
	    2.375922515527137,
	    0.21504824529657612,
	    0,
	    0
	  ],
	  [
	    2.3777454019634128,
	    0.205789628011383,
	    0,
	    0
	  ],
	  [
	    2.3794206173235986,
	    0.19689083946531133,
	    0,
	    0
	  ],
	  [
	    2.3809592396084067,
	    0.18834168473168889,
	    0,
	    0
	  ],
	  [
	    2.3823716365058556,
	    0.18013186379374693,
	    0,
	    0
	  ],
	  [
	    2.3836674939551004,
	    0.17225102361401823,
	    0,
	    0
	  ],
	  [
	    2.384855846193295,
	    0.1646888046573338,
	    0,
	    0
	  ],
	  [
	    2.3859451067449142,
	    0.1574348822030257,
	    0,
	    0
	  ],
	  [
	    2.386943099891083,
	    0.15047900279125884,
	    0,
	    0
	  ],
	  [
	    2.387857092227927,
	    0.14381101615082073,
	    0,
	    0
	  ],
	  [
	    2.388693823987581,
	    0.13742090295249954,
	    0,
	    0
	  ],
	  [
	    2.389459539853424,
	    0.13129879872456063,
	    0,
	    0
	  ],
	  [
	    2.390160019052548,
	    0.12543501425577144,
	    0,
	    0
	  ],
	  [
	    2.390800604553709,
	    0.11982005279781596,
	    0,
	    0
	  ],
	  [
	    2.391386231238564,
	    0.11444462436351505,
	    0,
	    0
	  ],
	  [
	    2.391921452948123,
	    0.10929965740062485,
	    0,
	    0
	  ],
	  [
	    2.3924104683356857,
	    0.1043763081036652,
	    0,
	    0
	  ],
	  [
	    2.3928571454824348,
	    0.09966596760861011,
	    0,
	    0
	  ],
	  [
	    2.393265045252806,
	    0.09516026729771561,
	    0,
	    0
	  ],
	  [
	    2.3936374433841925,
	    0.09085108242450426,
	    0,
	    0
	  ],
	  [
	    2.393977351319884,
	    0.08673053425218355,
	    0,
	    0
	  ],
	  [
	    2.394287535805758,
	    0.08279099088268502,
	    0,
	    0
	  ],
	  [
	    2.3945705372804786,
	    0.07902506693818387,
	    0,
	    0
	  ],
	  [
	    2.3948286870961963,
	    0.07542562224246287,
	    0,
	    0
	  ],
	  [
	    2.3950641236121633,
	    0.07198575963585582,
	    0,
	    0
	  ],
	  [
	    2.395278807207675,
	    0.0686988220447719,
	    0,
	    0
	  ],
	  [
	    2.395474534263447,
	    0.06555838891495455,
	    0,
	    0
	  ],
	  [
	    2.3956529501621793,
	    0.0625582721066553,
	    0,
	    0
	  ],
	  [
	    2.395815561359864,
	    0.05969251133978081,
	    0,
	    0
	  ],
	  [
	    2.3959637465794352,
	    0.05695536926776664,
	    0,
	    0
	  ],
	  [
	    2.39609876717785,
	    0.054341326250401244,
	    0,
	    0
	  ],
	  [
	    2.396221776736725,
	    0.051845074888037544,
	    0,
	    0
	  ],
	  [
	    2.3963338299252768,
	    0.04946151437252655,
	    0,
	    0
	  ],
	  [
	    2.396435890682732,
	    0.04718574470375868,
	    0,
	    0
	  ],
	  [
	    2.3965288397655176,
	    0.04501306081485033,
	    0,
	    0
	  ],
	  [
	    2.396613481702591,
	    0.04293894664372207,
	    0,
	    0
	  ],
	  [
	    2.3966905512001953,
	    0.04095906918403984,
	    0,
	    0
	  ],
	  [
	    2.396760719035214,
	    0.03906927254419144,
	    0,
	    0
	  ],
	  [
	    2.396824597474172,
	    0.03726557203910426,
	    0,
	    0
	  ],
	  [
	    2.396882745252786,
	    0.03554414833624339,
	    0,
	    0
	  ],
	  [
	    2.396935672148907,
	    0.03390134167402582,
	    0,
	    0
	  ],
	  [
	    2.3969838431796284,
	    0.03233364616811425,
	    0,
	    0
	  ],
	  [
	    2.3970276824513705,
	    0.030837704218581653,
	    0,
	    0
	  ],
	  [
	    2.397067576689836,
	    0.0294103010287397,
	    0,
	    0
	  ],
	  [
	    2.397103878474915,
	    0.028048359244471473,
	    0,
	    0
	  ],
	  [
	    2.397136909203867,
	    0.026748933721181808,
	    0,
	    0
	  ],
	  [
	    2.3971669618044578,
	    0.02550920642395034,
	    0,
	    0
	  ],
	  [
	    2.3971943032181637,
	    0.02432648146512805,
	    0,
	    0
	  ],
	  [
	    2.3972191766720767,
	    0.02319818028243567,
	    0,
	    0
	  ],
	  [
	    2.3972418037567547,
	    0.022121836959587828,
	    0,
	    0
	  ],
	  [
	    2.397262386325962,
	    0.021095093690562405,
	    0,
	    0
	  ],
	  [
	    2.3972811082330145,
	    0.020115696387850192,
	    0,
	    0
	  ],
	  [
	    2.397298136917325,
	    0.019181490434338904,
	    0,
	    0
	  ],
	  [
	    2.3973136248536466,
	    0.018290416577900873,
	    0,
	    0
	  ],
	  [
	    2.3973277108755653,
	    0.017440506967251426,
	    0,
	    0
	  ],
	  [
	    2.3973405213838372,
	    0.01662988132721864,
	    0,
	    0
	  ],
	  [
	    2.397352171449336,
	    0.015856743271204156,
	    0,
	    0
	  ],
	  [
	    2.3973627658195733,
	    0.01511937674831498,
	    0,
	    0
	  ],
	  [
	    2.3973723998370278,
	    0.014416142622396069,
	    0,
	    0
	  ],
	  [
	    2.397381160276849,
	    0.0137454753799918,
	    0,
	    0
	  ],
	  [
	    2.3973891261108555,
	    0.013105879964102585,
	    0,
	    0
	  ],
	  [
	    2.397396369204204,
	    0.012495928730477406,
	    0,
	    0
	  ],
	  [
	    2.39740295495054,
	    0.011914258523089062,
	    0,
	    0
	  ],
	  [
	    2.397408942850978,
	    0.01135956786537232,
	    0,
	    0
	  ],
	  [
	    2.3974143870417968,
	    0.010830614263763519,
	    0,
	    0
	  ],
	  [
	    2.397419336775313,
	    0.010326211620058713,
	    0,
	    0
	  ],
	  [
	    2.3974238368580485,
	    0.009845227749105075,
	    0,
	    0
	  ],
	  [
	    2.3974279280499045,
	    0.009386581998352723,
	    0,
	    0
	  ],
	  [
	    2.3974316474277924,
	    0.008949242965821053,
	    0,
	    0
	  ],
	  [
	    2.397435028716832,
	    0.00853222631307192,
	    0,
	    0
	  ],
	  [
	    2.397438102591979,
	    0.008134592669829034,
	    0,
	    0
	  ],
	  [
	    2.3974408969527006,
	    0.007755445626940273,
	    0,
	    0
	  ],
	  [
	    2.397443437173072,
	    0.007393929814441706,
	    0,
	    0
	  ],
	  [
	    2.397445746329474,
	    0.007049229061551143,
	    0,
	    0
	  ],
	  [
	    2.3974478454078882,
	    0.00672056463549245,
	    0,
	    0
	  ],
	  [
	    2.397449753492585,
	    0.006407193556128229,
	    0,
	    0
	  ],
	  [
	    2.39745148793788,
	    0.006108406983458562,
	    0,
	    0
	  ],
	  [
	    2.3974530645244445,
	    0.005823528675125142,
	    0,
	    0
	  ],
	  [
	    2.397454497601571,
	    0.005551913511142837,
	    0,
	    0
	  ],
	  [
	    2.3974558002166266,
	    0.005292946083165246,
	    0,
	    0
	  ],
	  [
	    2.3974569842328557,
	    0.005046039345674704,
	    0,
	    0
	  ],
	  [
	    2.3974580604365636,
	    0.004810633326571559,
	    0,
	    0
	  ],
	  [
	    2.3974590386346355,
	    0.004586193894721633,
	    0,
	    0
	  ],
	  [
	    2.3974599277432613,
	    0.00437221158210341,
	    0,
	    0
	  ],
	  [
	    2.397460735868648,
	    0.004168200458279044,
	    0,
	    0
	  ],
	  [
	    2.3974614703804416,
	    0.003973697054993924,
	    0,
	    0
	  ],
	  [
	    2.3974621379785224,
	    0.0037882593387891707,
	    0,
	    0
	  ],
	  [
	    2.3974627447537493,
	    0.0036114657295891494,
	    0,
	    0
	  ],
	  [
	    2.397463296243222,
	    0.0034429141633025,
	    0,
	    0
	  ],
	  [
	    2.397463797480536,
	    0.003282221196549611,
	    0,
	    0
	  ],
	  [
	    2.3974642530414907,
	    0.0031290211517016895,
	    0,
	    0
	  ],
	  [
	    2.39746466708566,
	    0.002982965300487771,
	    0,
	    0
	  ],
	  [
	    2.3974650433941918,
	    0.002843721084493969,
	    0,
	    0
	  ],
	  [
	    2.3974653854041916,
	    0.0027109713709463877,
	    0,
	    0
	  ],
	  [
	    2.397465696239978,
	    0.0025844137422334885,
	    0,
	    0
	  ],
	  [
	    2.3974659787415127,
	    0.00246375981768615,
	    0,
	    0
	  ],
	  [
	    2.3974662354902465,
	    0.0023487346061943698,
	    0,
	    0
	  ],
	  [
	    2.3974664688326253,
	    0.002239075888297921,
	    0,
	    0
	  ],
	  [
	    2.397466680901457,
	    0.002134533626444738,
	    0,
	    0
	  ],
	  [
	    2.3974668736353437,
	    0.0020348694021654085,
	    0,
	    0
	  ],
	  [
	    2.3974670487963436,
	    0.0019398558789646039,
	    0,
	    0
	  ],
	  [
	    2.3974672079860375,
	    0.0018492762897810784,
	    0,
	    0
	  ],
	  [
	    2.397467352660126,
	    0.001762923947916421,
	    0,
	    0
	  ],
	  [
	    2.3974674841417083,
	    0.0016806017803799615,
	    0,
	    0
	  ],
	  [
	    2.3974676036333493,
	    0.0016021218826422006,
	    0,
	    0
	  ],
	  [
	    2.3974677122280514,
	    0.0015273050938326316,
	    0,
	    0
	  ],
	  [
	    2.3974678109192276,
	    0.0014559805914595894,
	    0,
	    0
	  ],
	  [
	    2.397467900609772,
	    0.0013879855047697627,
	    0,
	    0
	  ],
	  [
	    2.3974679821203,
	    0.0013231645459035658,
	    0,
	    0
	  ],
	  [
	    2.3974680561966397,
	    0.0012613696580395268,
	    0,
	    0
	  ],
	  [
	    2.3974681235166475,
	    0.0012024596797561716,
	    0,
	    0
	  ],
	  [
	    2.3974681846963954,
	    0.001146300024874073,
	    0,
	    0
	  ],
	  [
	    2.3974682402957983,
	    0.0010927623770731582,
	    0,
	    0
	  ],
	  [
	    2.3974682908237366,
	    0.0010417243986116707,
	    0,
	    0
	  ],
	  [
	    2.3974683367426963,
	    0.0009930694525032032,
	    0,
	    0
	  ],
	  [
	    2.3974683784730044,
	    0.00094668633753675,
	    0,
	    0
	  ],
	  [
	    2.3974684163966655,
	    0.0009024690355523064,
	    0,
	    0
	  ],
	  [
	    2.397468450860857,
	    0.0008603164704108336,
	    0,
	    0
	  ],
	  [
	    2.3974684821811,
	    0.0008201322781224969,
	    0,
	    0
	  ],
	  [
	    2.3974685106441465,
	    0.0007818245876213326,
	    0,
	    0
	  ],
	  [
	    2.3974685365106025,
	    0.0007453058116973925,
	    0,
	    0
	  ],
	  [
	    2.3974685600173085,
	    0.0007104924476196144,
	    0,
	    0
	  ],
	  [
	    2.397468581379508,
	    0.0006773048870036646,
	    0,
	    0
	  ],
	  [
	    2.397468600792815,
	    0.0006456672344992455,
	    0,
	    0
	  ],
	  [
	    2.3974686184350045,
	    0.0006155071348906252,
	    0,
	    0
	  ],
	  [
	    2.3974686344676384,
	    0.0005867556082225889,
	    0,
	    0
	  ],
	  [
	    2.3974686490375436,
	    0.0005593468925816748,
	    0,
	    0
	  ],
	  [
	    2.397468662278155,
	    0.0005332182941793929,
	    0,
	    0
	  ],
	  [
	    2.3974686743107383,
	    0.000508310044400219,
	    0,
	    0
	  ],
	  [
	    2.3974686852454976,
	    0.00048456516349258927,
	    0,
	    0
	  ],
	  [
	    2.397468695182585,
	    0.0004619293305957818,
	    0,
	    0
	  ],
	  [
	    2.397468704213019,
	    0.00044035075980964147,
	    0,
	    0
	  ],
	  [
	    2.3974687124195135,
	    0.0004197800820275419,
	    0,
	    0
	  ],
	  [
	    2.397468719877238,
	    0.0004001702322657469,
	    0,
	    0
	  ],
	  [
	    2.3974687266545067,
	    0.0003814763422346362,
	    0,
	    0
	  ],
	  [
	    2.3974687328133992,
	    0.0003636556379088857,
	    0,
	    0
	  ],
	  [
	    2.3974687384103337,
	    0.0003466673418649154,
	    0,
	    0
	  ],
	  [
	    2.397468743496582,
	    0.0003304725801645369,
	    0,
	    0
	  ],
	  [
	    2.397468748118737,
	    0.00031503429357391226,
	    0,
	    0
	  ],
	  [
	    2.3974687523191425,
	    0.0003003171529166748,
	    0,
	    0
	  ],
	  [
	    2.3974687561362784,
	    0.0002862874783692915,
	    0,
	    0
	  ],
	  [
	    2.3974687596051147,
	    0.00027291316251564526,
	    0,
	    0
	  ],
	  [
	    2.39746876275743,
	    0.0002601635969862308,
	    0,
	    0
	  ],
	  [
	    2.397468765622105,
	    0.0002480096025154269,
	    0,
	    0
	  ],
	  [
	    2.3974687682253846,
	    0.00023642336225801236,
	    0,
	    0
	  ],
	  [
	    2.397468770591119,
	    0.0002253783582134261,
	    0,
	    0
	  ],
	  [
	    2.3974687727409827,
	    0.00021484931061328233,
	    0,
	    0
	  ],
	  [
	    2.3974687746946732,
	    0.0002048121201343383,
	    0,
	    0
	  ],
	  [
	    2.3974687764700904,
	    0.00019524381280549153,
	    0,
	    0
	  ],
	  [
	    2.3974687780835007,
	    0.00018612248748346792,
	    0,
	    0
	  ],
	  [
	    2.3974687795496865,
	    0.0001774272657776737,
	    0,
	    0
	  ],
	  [
	    2.397468780882082,
	    0.00016913824431022403,
	    0,
	    0
	  ],
	  [
	    2.3974687820928953,
	    0.00016123644920243907,
	    0,
	    0
	  ],
	  [
	    2.3974687831932195,
	    0.00015370379268415675,
	    0,
	    0
	  ],
	  [
	    2.397468784193138,
	    0.00014652303172700117,
	    0,
	    0
	  ],
	  [
	    2.397468785101812,
	    0.00013967772860735403,
	    0,
	    0
	  ],
	  [
	    2.397468785927567,
	    0.000133152213309135,
	    0,
	    0
	  ],
	  [
	    2.3974687866779703,
	    0.0001269315476806905,
	    0,
	    0
	  ],
	  [
	    2.397468787359897,
	    0.00012100149126405185,
	    0,
	    0
	  ],
	  [
	    2.397468787979596,
	    0.00011534846871864036,
	    0,
	    0
	  ],
	  [
	    2.3974687885427457,
	    0.00010995953876510535,
	    0,
	    0
	  ],
	  [
	    2.3974687890545057,
	    0.0001048223645784468,
	    0,
	    0
	  ],
	  [
	    2.397468789519566,
	    0.00009992518556286006,
	    0,
	    0
	  ],
	  [
	    2.3974687899421876,
	    0.00009525679044388711,
	    0,
	    0
	  ],
	  [
	    2.3974687903262435,
	    0.00009080649161645948,
	    0,
	    0
	  ],
	  [
	    2.3974687906752528,
	    0.0000865641006902665,
	    0,
	    0
	  ],
	  [
	    2.3974687909924133,
	    0.00008251990517661483,
	    0,
	    0
	  ],
	  [
	    2.3974687912806316,
	    0.00007866464626354641,
	    0,
	    0
	  ],
	  [
	    2.3974687915425488,
	    0.00007498949762845111,
	    0,
	    0
	  ],
	  [
	    2.397468791780564,
	    0.00007148604523978551,
	    0,
	    0
	  ],
	  [
	    2.3974687919968605,
	    0.00006814626810175412,
	    0,
	    0
	  ],
	  [
	    2.397468792193418,
	    0.00006496251989796162,
	    0,
	    0
	  ],
	  [
	    2.3974687923720386,
	    0.00006192751149209829,
	    0,
	    0
	  ],
	  [
	    2.39746879253436,
	    0.00005903429424566603,
	    0,
	    0
	  ],
	  [
	    2.3974687926818676,
	    0.00005627624411462521,
	    0,
	    0
	  ],
	  [
	    2.3974687928159146,
	    0.00005364704648861123,
	    0,
	    0
	  ],
	  [
	    2.3974687929377287,
	    0.00005114068173807149,
	    0,
	    0
	  ],
	  [
	    2.3974687930484273,
	    0.00004875141143628079,
	    0,
	    0
	  ],
	  [
	    2.3974687931490237,
	    0.00004647376522474107,
	    0,
	    0
	  ],
	  [
	    2.3974687932404404,
	    0.00004430252829193366,
	    0,
	    0
	  ],
	  [
	    2.3974687933235144,
	    0.00004223272943679786,
	    0,
	    0
	  ],
	  [
	    2.3974687933990078,
	    0.00004025962968963913,
	    0,
	    0
	  ],
	  [
	    2.3974687934676115,
	    0.00003837871146444906,
	    0,
	    0
	  ],
	  [
	    2.397468793529955,
	    0.000036585668217827286,
	    0,
	    0
	  ],
	  [
	    2.397468793586609,
	    0.00003487639459085677,
	    0,
	    0
	  ],
	  [
	    2.3974687936380934,
	    0.00003324697701138594,
	    0,
	    0
	  ],
	  [
	    2.397468793684879,
	    0.000031693684735220784,
	    0,
	    0
	  ],
	  [
	    2.3974687937273953,
	    0.000030212961305737207,
	    0,
	    0
	  ],
	  [
	    2.3974687937660315,
	    0.00002880141641237584,
	    0,
	    0
	  ],
	  [
	    2.3974687938011425,
	    0.00002745581812939587,
	    0,
	    0
	  ],
	  [
	    2.397468793833049,
	    0.00002617308551713183,
	    0,
	    0
	  ],
	  [
	    2.397468793862044,
	    0.00002495028156882763,
	    0,
	    0
	  ],
	  [
	    2.3974687938883927,
	    0.000023784606486909614,
	    0,
	    0
	  ],
	  [
	    2.3974687939123367,
	    0.00002267339127331657,
	    0,
	    0
	  ],
	  [
	    2.397468793934096,
	    0.000021614091619219478,
	    0,
	    0
	  ],
	  [
	    2.39746879395387,
	    0.000020604282080150943,
	    0,
	    0
	  ],
	  [
	    2.3974687939718393,
	    0.000019641650523215703,
	    0,
	    0
	  ],
	  [
	    2.3974687939881685,
	    0.000018723992833675052,
	    0,
	    0
	  ],
	  [
	    2.3974687940030073,
	    0.000017849207868793367,
	    0,
	    0
	  ],
	  [
	    2.397468794016492,
	    0.000017015292647397386,
	    0,
	    0
	  ],
	  [
	    2.3974687940287467,
	    0.00001622033776414108,
	    0,
	    0
	  ],
	  [
	    2.3974687940398827,
	    0.000015462523017981008,
	    0,
	    0
	  ],
	  [
	    2.397468794050003,
	    0.000014740113244856968,
	    0,
	    0
	  ],
	  [
	    2.3974687940591988,
	    0.00001405145434504113,
	    0,
	    0
	  ],
	  [
	    2.397468794067556,
	    0.000013394969496063389,
	    0,
	    0
	  ],
	  [
	    2.3974687940751505,
	    0.000012769155542544555,
	    0,
	    0
	  ],
	  [
	    2.3974687940820516,
	    0.000012172579554675474,
	    0,
	    0
	  ],
	  [
	    2.3974687940883235,
	    0.000011603875547463932,
	    0,
	    0
	  ],
	  [
	    2.397468794094023,
	    0.00001106174135324111,
	    0,
	    0
	  ],
	  [
	    2.397468794099202,
	    0.000010544935640267928,
	    0,
	    0
	  ],
	  [
	    2.3974687941039083,
	    0.000010052275070617967,
	    0,
	    0
	  ],
	  [
	    2.397468794108186,
	    0.00000958263159083048,
	    0,
	    0
	  ],
	  [
	    2.397468794112072,
	    0.000009134929849132473,
	    0,
	    0
	  ],
	  [
	    2.3974687941156043,
	    0.000008708144733317006,
	    0,
	    0
	  ],
	  [
	    2.3974687941188138,
	    0.000008301299023642233,
	    0,
	    0
	  ],
	  [
	    2.3974687941217305,
	    0.000007913461155377843,
	    0,
	    0
	  ],
	  [
	    2.3974687941243813,
	    0.000007543743085877514,
	    0,
	    0
	  ],
	  [
	    2.39746879412679,
	    0.0000071912982612941945,
	    0,
	    0
	  ],
	  [
	    2.397468794128979,
	    0.00000685531967828392,
	    0,
	    0
	  ],
	  [
	    2.397468794130968,
	    0.000006535038036260927,
	    0,
	    0
	  ],
	  [
	    2.3974687941327755,
	    0.000006229719975973888,
	    0,
	    0
	  ],
	  [
	    2.397468794134418,
	    0.000005938666400370827,
	    0,
	    0
	  ],
	  [
	    2.397468794135911,
	    0.000005661210873909149,
	    0,
	    0
	  ],
	  [
	    2.3974687941372674,
	    0.000005396718096645467,
	    0,
	    0
	  ],
	  [
	    2.3974687941385002,
	    0.000005144582449612669,
	    0,
	    0
	  ],
	  [
	    2.3974687941396207,
	    0.000004904226608153443,
	    0,
	    0
	  ],
	  [
	    2.397468794140639,
	    0.000004675100220035986,
	    0,
	    0
	  ],
	  [
	    2.397468794141564,
	    0.000004456678645325569,
	    0,
	    0
	  ],
	  [
	    2.3974687941424047,
	    0.000004248461755126638,
	    0,
	    0
	  ],
	  [
	    2.3974687941431685,
	    0.000004049972786445764,
	    0,
	    0
	  ],
	  [
	    2.3974687941438626,
	    0.000003860757250553173,
	    0,
	    0
	  ],
	  [
	    2.397468794144493,
	    0.0000036803818923441363,
	    0,
	    0
	  ],
	  [
	    2.397468794145067,
	    0.0000035084336983170773,
	    0,
	    0
	  ],
	  [
	    2.397468794145588,
	    0.000003344518950897727,
	    0,
	    0
	  ],
	  [
	    2.3974687941460613,
	    0.0000031882623269438035,
	    0,
	    0
	  ],
	  [
	    2.397468794146492,
	    0.0000030393060383665505,
	    0,
	    0
	  ],
	  [
	    2.3974687941468824,
	    0.0000028973090129011828,
	    0,
	    0
	  ],
	  [
	    2.3974687941472377,
	    0.0000027619461131508753,
	    0,
	    0
	  ],
	  [
	    2.397468794147561,
	    0.0000026329073921162726,
	    0,
	    0
	  ],
	  [
	    2.3974687941478545,
	    0.0000025098973835056412,
	    0,
	    0
	  ],
	  [
	    2.397468794148121,
	    0.0000023926344252013016,
	    0,
	    0
	  ],
	  [
	    2.397468794148363,
	    0.0000022808500143329223,
	    0,
	    0
	  ],
	  [
	    2.3974687941485837,
	    0.000002174288192481311,
	    0,
	    0
	  ],
	  [
	    2.3974687941487836,
	    0.0000020727049596049217,
	    0,
	    0
	  ],
	  [
	    2.397468794148965,
	    0.0000019758677153474024,
	    0,
	    0
	  ],
	  [
	    2.3974687941491304,
	    0.0000018835547264466953,
	    0,
	    0
	  ],
	  [
	    2.3974687941492805,
	    0.0000017955546190265128,
	    0,
	    0
	  ],
	  [
	    2.3974687941494173,
	    0.0000017116658946076909,
	    0,
	    0
	  ],
	  [
	    2.397468794149541,
	    0.0000016316964687310874,
	    0,
	    0
	  ],
	  [
	    2.397468794149654,
	    0.000001555463231135871,
	    0,
	    0
	  ],
	  [
	    2.3974687941497566,
	    0.0000014827916264859885,
	    0,
	    0
	  ],
	  [
	    2.3974687941498494,
	    0.000001413515254684983,
	    0,
	    0
	  ],
	  [
	    2.3974687941499337,
	    0.0000013474754898638069,
	    0,
	    0
	  ]
	];

/***/ })
/******/ ])
});
;