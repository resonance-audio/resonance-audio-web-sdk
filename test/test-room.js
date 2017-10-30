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
 * Test Room object.
 */
describe('Room', function() {
  // This test is async, override timeout threshold to 5 sec.
  this.timeout(5000);

  const sampleRate = 48000;
  const options = {};

  let context;
  let room;
  let bufferSource;

  beforeEach(function() {
    // Create nodes.
    context =
      new OfflineAudioContext(4, 1024, sampleRate);
    room = new ResonanceAudio.Room(context, options);
    bufferSource = context.createBufferSource();
    bufferSource.buffer = context.createBuffer(1, 1, sampleRate);
    bufferSource.buffer.getChannelData(0)[0] = 1;

    // Connect audio graph.
    bufferSource.connect(room.early.input);
    bufferSource.connect(room.late.input);
    room.output.connect(context.destination);
    bufferSource.start();
  });

  it('Ensure module produces output.', function(done) {
    let dimensions = {
      width: 1, height: 1, depth: 1,
    };
    let materials = {
      left: 'uniform', right: 'uniform',
      front: 'uniform', back: 'uniform',
      down: 'uniform', up: 'uniform',
    };
    room.setProperties(dimensions, materials);
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
