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
 * Test Tables.
 */
describe('Tables', function() {
  // This test is async, override timeout threshold to 5 sec.
  this.timeout(5000);

  let sH = ResonanceAudio.Tables.SPHERICAL_HARMONICS;
  let mRW = ResonanceAudio.Tables.MAX_RE_WEIGHTS;
  let expectedAmbisonicOrder =
    ResonanceAudio.Tables.SPHERICAL_HARMONICS_MAX_ORDER;

  beforeEach(function() {
  });

  it('Verify SPHERICAL_HARMONICS_MAX_ORDER.',
    function(done) {
      let actualAmbisonicOrder = sH[0][0].length / 2;
      expect(expectedAmbisonicOrder == actualAmbisonicOrder);
      done();
    }
  );

  it('Verify SPHERICAL_HARMONICS size.',
    function(done) {
      let expectedAzimuthLength = expectedAmbisonicOrder * 2;
      let expectedElevationLength =
        (expectedAmbisonicOrder + 1) * (expectedAmbisonicOrder + 2) / 2 - 1;

      expect(sH.length == 2);
      expect(sH[0].length ==
        ResonanceAudio.Tables.SPHERICAL_HARMONICS_AZIMUTH_RESOLUTION);
      for (let i = 0; i < sH[0].length; i++) {
        expect(sH[0][i].length == expectedAzimuthLength);
      }

      expect(sH[1].length ==
        ResonanceAudio.Tables.SPHERICAL_HARMONICS_ELEVATION_RESOLUTION);
      for (let i = 0; i < sH[1].length; i++) {
        expect(sH[1][i].length == expectedElevationLength);
      }
      done();
    }
  );

  it('Verify MAX_RE_WEIGHTS size.',
    function(done) {
      expect(mRW.length == ResonanceAudio.Tables.MAX_RE_WEIGHTS_RESOLUTION);
      for (let i = 0; i < mRW.length; i++) {
        expect(mRW[i].length == expectedAmbisonicOrder + 1);
      }
      done();
    }
  );
});
