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

/**
 * @class Globals
 * @description Mathematical constants and default values for submodules.
 */
var Globals = {};

// Math constants.
Globals.TwoPi = 6.28318530717959;
Globals.TwentyFourLog10 = 55.2620422318571;
Globals.TwentyFourLog10Div343 = 0.161113825748855;
Globals.Log1000 = 6.90775527898214;
Globals.Log2Div2 = 0.346573590279973;
Globals.PiByOneEighty = 0.017453292519943;
Globals.OneEightyByPi = 57.295779513082323;

// Numerical constants.
Globals.EpsilonFloat = 1e-6;

/** Rolloff models (e.g. 'logarithmic', 'linear', or 'none'). */
Globals.RolloffModels = ['logarithmic', 'linear', 'none'];
/** Default rolloff model ('logarithmic'). */
Globals.DefaultRolloffModel = 'logarithmic';
Globals.DefaultMinDistance = 1;
Globals.DefaultMaxDistance = 1000;
Globals.DefaultGainLinear = 1;
Globals.DefaultPosition = [0, 0, 0];
Globals.DefaultOrientation = [0, 0, -1];

// Listener defaults.
Globals.DefaultAmbisonicOrder = 1;
Globals.DefaultSpeedOfSound = 343;

// Reverb constants and defaults.
/**
 * Center frequencies of the multiband reverberation engine.
 * Nine bands are computed by: 31.25 * 2^(0:8).
 * @member {Array}
 */
Globals.ReverbBands = [31.25, 62.5, 125, 250, 500, 1000, 2000, 4000, 8000];
/** The number of center frequencies supported.
 * @member {Number}
 */
Globals.NumReverbBands = Globals.ReverbBands.length;
/** The default bandwidth of the center frequencies. */
Globals.ReverbBandwidth = 1;
/** The default multiplier applied when computing tail lengths. */
Globals.ReverbDurationMultiplier = 1;
Globals.DefaultReverbPreDelayMs = 1.5;
Globals.DefaultReverbTailOnsetMs = 3.8;
Globals.DefaultReverbGain = 0.01;
Globals.DefaultReverbMaxDurationSecs = 3;

// Reflections constants and defaults.
Globals.ReflectionsMaxDuration = 1;
Globals.DefaultReflectionsCutoffFrequency = 6400; // -12dB cutoff.
Globals.DefaultReflectionsStartingBand = 4;
Globals.DefaultReflectionsNumAveragingBands = 3;

module.exports = Globals;
