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
 */
describe('Attenuation', function() {
  // This test is async, override timeout threshold to 5 sec.
  this.timeout(5000);

  const sampleRate = 48000;
  const threshold = 1e-7;
  const numTestsPerModel = 1000;
  const rolloffModels = ['logarithmic', 'linear', 'none'];
  const options = {minDistance: 1, maxDistance: 1000};
  const distanceMin = 0;
  const distanceMax = options.maxDistance * 1.1;

  let context;
  let attenuation;
  let bufferSource;

  beforeEach(function() {
    // Create nodes.
    context =
      new OfflineAudioContext(1, 1, sampleRate);
    attenuation = new ResonanceAudio.Attenuation(context, options);
    bufferSource = context.createBufferSource();
    bufferSource.buffer = context.createBuffer(1, 1, sampleRate);
    bufferSource.buffer.getChannelData(0)[0] = 1;

    // Connect audio graph.
    bufferSource.connect(attenuation.input);
    attenuation.output.connect(context.destination);
    bufferSource.start();
  });

  it('Ensure module produces output.', function(done) {
    attenuation.setRolloff('logarithmic');
    attenuation.setDistance(1);
    context.startRendering().then(function(renderedBuffer) {
      let outputPower = 0;
      for (let i = 0; i < renderedBuffer.numberOfChannels; i++) {
        let buffer = renderedBuffer.getChannelData(i);
        for (let j = 0; j < buffer.length; j++) {
          outputPower += buffer[j] * buffer[j];
        }
      }
      expect(outputPower).to.be.above(0);
      done();
    });
  });

  it('#setDistance/#setRolloff: Verify various configurations.',
    function(done) {
      for (let i = 0; i < rolloffModels.length; i++) {
        attenuation.setRolloff(rolloffModels[i]);
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
              let range = options.maxDistance - options.minDistance;
              if (range > threshold) {
                let relativeDistance = distance - options.minDistance;
                let atten = 1 / (relativeDistance + 1);
                let attenMax = 1 / (range + 1);
                expectedGain =
                  (atten - attenMax) / (1 - attenMax);
              }
            }
          } else if (rolloffModels[i] == 'linear') {
            if (distance > options.maxDistance) {
              expectedGain = 0;
            } else if (distance > options.minDistance) {
              let range = options.maxDistance - options.minDistance;
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
});
