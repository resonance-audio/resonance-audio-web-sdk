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
 * @file Songbird library common utilities, mathematical constants,
 * and default values.
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
exports.EPSILON_FLOAT = 1e-8;
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
exports.DEFAULT_SPEED_OF_SOUND = 343;

// Helper functions
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

// Static temp storage for matrix inversion.
var a00, a01, a02, a03, a10, a11, a12, a13;
var a20, a21, a22, a23, a30, a31, a32, a33;
var b00, b01, b02, b03, b04, b05, b06, b07, b08, b09, b10, b11;
var det;

/**
 * A 4x4 matrix inversion utility. This does not handle the case when the
 * arguments are not proper 4x4 matrices.
 * @param {Float32Array} out   The inverted result.
 * @param {Float32Array} a     The source matrix.
 * @returns {Float32Array} out
 */
exports.invertMatrix4 = function(out, a) {
  a00 = a[0];
  a01 = a[1];
  a02 = a[2];
  a03 = a[3];
  a10 = a[4];
  a11 = a[5];
  a12 = a[6];
  a13 = a[7];
  a20 = a[8];
  a21 = a[9];
  a22 = a[10];
  a23 = a[11];
  a30 = a[12];
  a31 = a[13];
  a32 = a[14];
  a33 = a[15];
  b00 = a00 * a11 - a01 * a10;
  b01 = a00 * a12 - a02 * a10;
  b02 = a00 * a13 - a03 * a10;
  b03 = a01 * a12 - a02 * a11;
  b04 = a01 * a13 - a03 * a11;
  b05 = a02 * a13 - a03 * a12;
  b06 = a20 * a31 - a21 * a30;
  b07 = a20 * a32 - a22 * a30;
  b08 = a20 * a33 - a23 * a30;
  b09 = a21 * a32 - a22 * a31;
  b10 = a21 * a33 - a23 * a31;
  b11 = a22 * a33 - a23 * a32;
  det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  if (!det)
    return null;

  det = 1.0 / det;
  out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

  return out;
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

/**
 * Normalize a 3-d vector.
 * @param {Float32Array} v 3-element vector.
 * @returns {Float32Array} 3-element vector.
 */
exports.normalizeVector = function (v) {
  var n = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (n > exports.EPSILON_FLOAT) {
    n = 1 / n;
    v[0] *= n;
    v[1] *= n;
    v[2] *= n;
  }
  return v;
}