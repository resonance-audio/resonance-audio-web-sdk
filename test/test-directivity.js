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
 * Test Directivity object.
 */
describe('Directivity', function() {
  // This test is async, override timeout threshold to 5 sec.
  this.timeout(5000);

  const sampleRate = 48000;
  const numTestsPerModel = 1000;
  const options = {};
  const alphaThreshold = 1e-8;
  const errorThreshold = 1e-2; // Threshold is in Hertz.
  const forward = [0, 0, 1];

  let context;
  let directivity;
  let bufferSource;

  beforeEach(function() {
    context =
      new OfflineAudioContext(1, 1, sampleRate);
    directivity = new ResonanceAudio.Directivity(context, options);
    bufferSource = context.createBufferSource();
    bufferSource.buffer = context.createBuffer(1, 1, sampleRate);
    bufferSource.buffer.getChannelData(0)[0] = 1;

    // Connect audio graph.
    bufferSource.connect(directivity.input);
    directivity.output.connect(context.destination);
    bufferSource.start();
  });

  it('Ensure module produces output.', function(done) {
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

  it('#setPattern/#computeAngle: Verify various configurations.',
    function(done) {
      for (let i = 0; i < numTestsPerModel; i++) {
        let alpha = Math.random();
        let sharpness = Math.random() * 4 + 1;
        directivity.setPattern(alpha, sharpness);
        let directionTheta = 2 * Math.PI * Math.random();
        let directionPhi = Math.acos(2 * Math.random() - 1);
        direction = [
          Math.cos(directionTheta) * Math.cos(directionPhi),
          Math.sin(directionPhi),
          Math.sin(directionTheta) * Math.cos(directionPhi),
        ];
        directionMag = Math.sqrt(direction[0] * direction[0] +
          direction[1] * direction[1] + direction[2] * direction[2]);
        direction[0] /= directionMag;
        direction[1] /= directionMag;
        direction[2] /= directionMag;
        directivity.computeAngle(forward, direction);
        let expectedCoeff = 1;
        if (alpha > alphaThreshold) {
          let cosTheta = forward[0] * direction[0] +
            forward[1] * direction[1] + forward[2] * direction[2];
          expectedCoeff = (1 - alpha) + alpha * cosTheta;
          expectedCoeff = Math.pow(Math.abs(expectedCoeff), sharpness);
        }
        let expectedValue = sampleRate * 0.5 * expectedCoeff;
        let actualValue = directivity._lowpass.frequency.value;
        expect(Math.abs(expectedValue - actualValue)).to.be
          .below(errorThreshold);
      }
      done();
    }
  );
});
