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
 * @file Primary namespace for ResonanceAudio library.
 * @author Andrew Allen <bitllama@google.com>
 */

 'use strict';


// Main module.
exports.ResonanceAudio = require('./resonance-audio.js');


// Testable Submodules.
exports.ResonanceAudio.Attenuation = require('./attenuation.js');
exports.ResonanceAudio.Directivity = require('./directivity.js');
exports.ResonanceAudio.EarlyReflections = require('./early-reflections.js');
exports.ResonanceAudio.Encoder = require('./encoder.js');
exports.ResonanceAudio.LateReflections = require('./late-reflections.js');
exports.ResonanceAudio.Listener = require('./listener.js');
exports.ResonanceAudio.Room = require('./room.js');
exports.ResonanceAudio.Source = require('./source.js');
exports.ResonanceAudio.Tables = require('./tables.js');
exports.ResonanceAudio.Utils = require('./utils.js');
exports.ResonanceAudio.Version = require('./version.js');
