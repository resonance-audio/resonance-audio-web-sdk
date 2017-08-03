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
 * Test Attenuation object.
 *
 * Compute and compare expected gains from different distances and roll-off
 * models. Verify capitalization is ignored for setting roll-off model.
 */
describe('Attenuation', function () {
  // This test is async, override timeout threshold to 5 sec.
  this.timeout(5000);

  var sampleRate = 48000;
  var numTestsPerModel = 1000;
  var rolloffModels = ['logarithmic', 'linear', 'none'];
  var options = {minDistance: 1, maxDistance: 1000};
  var distanceMin = 0;
  var distanceMax = options.maxDistance * 1.1;
  var threshold = 1e-7;

  var context;
  var attenuation;

  beforeEach(function () {
    context =
      new OfflineAudioContext(1, 1, sampleRate);
    attenuation = Songbird.createAttenuation(context, options);
  });

  it('#setDistance: verify the attenuation of rolloff models with ' +
    numTestsPerModel + ' tests .',
    function (done) {
      for (let i = 0; i < rolloffModels.length; i++) {
        attenuation.setRolloffModel(rolloffModels[i]);
        for (let j = 0; j < numTestsPerModel; j++) {
          let distance =
            Math.random() * (distanceMax - distanceMin) + distanceMin;
          attenuation.setDistance(distance);
          let actualGain = attenuation.output.gain.value;

          // Compute expected value.
          let expectedGain = 1;
          if (rolloffModels[i] == 'logarithmic') {
            if (distance > options.maxDistance) {
              expectedGain = 0;
            } else if (distance > options.minDistance) {
              var range = options.maxDistance - options.minDistance;
              if (range > threshold) {
                var relativeDistance = distance - options.minDistance;
                var atten = 1 / (relativeDistance + 1);
                var attenMax = 1 / (range + 1);
                expectedGain =
                  (atten - attenMax) / (1 - attenMax);
              }
            }
          } else if (rolloffModels[i] == 'linear') {
            if (distance > options.maxDistance) {
              expectedGain = 0;
            } else if (distance > options.minDistance) {
              var range = options.maxDistance - options.minDistance;
              if (range > threshold) {
                expectedGain = (options.maxDistance - distance) / range;
              }
            }
          }
          expect(Math.abs(actualGain - expectedGain)).to.be.below(threshold);
        }
      }
      done();
    }
  );

  it('#setRolloffModel: ensure case is ignored when specifying model.',
    function (done) {
      let rolloffModelsBad = ['LOGARITHMIC', 'LOgArItHMIC', 'LiNeAR', 'None',
        'logARITHMIC', 'linEAR', 'logarithmIC', 'noNe'];
      let rolloffModelsFixed = ['logarithmic', 'logarithmic', 'linear',
        'none', 'logarithmic', 'linear', 'logarithmic', 'none'];
      for (let i = 0; i < rolloffModelsBad.length; i++) {
        attenuation.setRolloffModel(rolloffModelsBad[i]);
        let expectedModel = rolloffModelsFixed[i];
        let actualModel = attenuation._rolloffModel;
        expect(actualModel).to.be.equal(expectedModel);
      }
      done();
    }
  );
});