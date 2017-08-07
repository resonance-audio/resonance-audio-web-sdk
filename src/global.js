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

