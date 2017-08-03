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