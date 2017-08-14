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
 * @file Primary namespace for Songbird library.
 * @author Andrew Allen <bitllama@google.com>
 */

 'use strict';


// Main module.
exports.Songbird = require('./songbird.js');


// Testable Submodules.
exports.Songbird.Attenuation = require('./attenuation.js');
exports.Songbird.Directivity = require('./directivity.js');
exports.Songbird.EarlyReflections = require('./early-reflections.js');
exports.Songbird.Encoder = require('./encoder.js');
exports.Songbird.LateReflections = require('./late-reflections.js');
exports.Songbird.Listener = require('./listener.js');
exports.Songbird.Room = require('./room.js');
exports.Songbird.Source = require('./source.js');
exports.Songbird.Tables = require('./tables.js');
exports.Songbird.Utils = require('./utils.js');
exports.Songbird.Version = require('./version.js');
