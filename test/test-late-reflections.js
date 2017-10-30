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
 * Test LateReflections object.
 */
describe('LateReflections', function() {
  // This test is async, override timeout threshold to 5 sec.
  this.timeout(5000);

  const sampleRate = 48000;
  const options = {};
  const durations = [1, 1, 1, 1, 1, 1, 1, 1, 1];

  let context;
  let lateReflections;
  let bufferSource;

  beforeEach(function() {
    // Create nodes.
    context =
      new OfflineAudioContext(1, 1024, sampleRate);
    lateReflections = new ResonanceAudio.LateReflections(context, options);
    bufferSource = context.createBufferSource();
    bufferSource.buffer = context.createBuffer(1, 1, sampleRate);
    bufferSource.buffer.getChannelData(0)[0] = 1;

    // Connect audio graph.
    bufferSource.connect(lateReflections.input);
    lateReflections.output.connect(context.destination);
    bufferSource.start();
  });

  it('Ensure module produces output.', function(done) {
    lateReflections.setDurations(durations);
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
});
