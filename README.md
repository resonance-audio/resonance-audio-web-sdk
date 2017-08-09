# Songbird: Spatial Audio Encoding on the Web

<!-- TODO(bitllama): Add Travis support -->
<!-- [![Travis](https://img.shields.io/travis/GoogleChrome/omnitone.svg)](https://travis-ci.org/GoogleChrome/omnitone) [![npm](https://img.shields.io/npm/v/omnitone.svg?colorB=4bc51d)](https://www.npmjs.com/package/omnitone) [![GitHub license](https://img.shields.io/badge/license-Apache%202-brightgreen.svg)](https://raw.githubusercontent.com/GoogleChrome/omnitone/master/LICENSE) -->

Songbird is a real-time spatial audio encoding JavaScript library for WebAudio
applications. It allows web developers to dynamically spatially-encode
streaming audio content into scalable
[ambisonics](https://en.wikipedia.org/wiki/Ambisonics) signal, which can be
rendered using a binaural renderer such as
[Omnitone](https://github.com/GoogleChrome/omnitone) for realistic and
quality-scalable 3D audio.

The implementation of Songbird is based on the
[Google spatial media](https://github.com/google/spatial-media) specification.
It expects mono (1-channel) input to its `Source` instances and outputs
ambisonic (multichannel) ACN channel layout with SN3D normalization.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [How it works](#how-it-works)
  - ["Hello World" Example](#hello-world-example)
  - [Source/Listener Placement](#sourcelistener-placement)
  - [Room Properties](#room-properties)
- [Building](#building)
- [Test](#test)
  - [Testing Songbird Locally](#testing-songbird-locally)
- [Audio Codec Compatibility](#audio-codec-compatibility)
- [Related Resources](#related-resources)
- [Acknowledgments](#acknowledgments)
- [Support](#support)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## How it works

Songbird is a JavaScript API that supports real-time spatial audio encoding for
the Web using Higher-Order Ambisonics (HOA). This is accomplished by attached
audio input to a `Source` which has associated spatial object parameters.
`Source` objects are attached to a `Songbird` instance, which models the
listener as well as the room environment the listener and sources are in.
Binaurally-rendered ambisonic output is generated using
[Omnitone](https://github.com/GoogleChrome/omnitone), and raw ambisonic output
is exposed as well.

<p align="center">
  <img src="../diagram-songbird.png" alt="Songbird Diagram">
</p>

<!-- TODO(bitllama): Actually put Songbird on NPM -->
<!-- ## Installation

Songbird is designed to be used for web front-end projects. So [NPM](https://www.npmjs.com/) is recommended if you want to install the library to your web project. You can also clone this repository and use the library file as usual.

```bash
npm install songbird
``` -->


## Usage

The first step is to include the library file in an HTML document.

```html
<!-- Use Songbird from installed node_modules/ -->
<script src="node_modules/Songbird/build/songbird.min.js"></script>

<!-- TODO(bitllama): rawgit/CDN -->
<!-- if you prefer to use CDN -->
<script src="THISISNOTAREALLINKBUTITWILLBESOON.js"></script>
```

Spatial encoding is done by creating a `Songbird` instance using an associted
`AudioContext` and then creating any number of associated `Source` objects
using `Songbird.createSource()`. The `Songbird` instance models a physical
listener while adding room reflections and reverberation. The `Source`
instances model acoustic sound sources. The library is designed to be easily
integrated into an existing WebAudio audio graph.


### "Hello World" Example

```js
// Create an AudioContext.
var context = new AudioContext();

// Prepare audio element to feed the ambisonic source audio feed.
var audioElement = document.createElement('audio');
audioElement.src = 'resources/SpeechSample.wav';

// Create AudioNode to connect the audio element to WebAudio.
var audioElementSource = context.createMediaElementSource(audioElement);

// Create a 1st-order Ambisonics Songbird Listener.
var songbird = new Songbird(context);

// Send songbird to audio output.
songbird.output.connect(context.destination);

// Create a Songbird Source, connect desired audio input to it.
var source = songbird.createSource();
audioElementSource.connect(source.input);

// Pan an audio source 45 degrees to the left (counter-clockwise).
source.setAngleFromListener(45);

// Wait 1 second and then playback the audio.
setTimeout(audioElement.play(), 1000);
```


### Source/Listener Placement

Usage begins by creating a `Songbird` instance, which manages all your sources,
the listener and the reverberation model.

```js
var songbird = new Songbird(audioContext);
```

Once the main `Songbird` instance is created, it can be used to be create
as many sources as you desired.

```js
var source = songbird.createSource();

// Create other sources.
var sourceB = songbird.createSource();
var sourceC = songbird.createSource();
// etc. ...
```

These `Source` instances are automatically managed and modelled by the
`Songbird` instance. Simply provide the desired monophonic input to each source
to complete the audio graph.

```js
audioElementSource.connect(source.input);
```

`Source` objects can be placed relative to the listener or using absolute
coordinates. Songbird uses a counter-clockwise, right-handed coordinate system,
similar to OpenGL and Three.js.

```js
// Set source's position relative to the listener.
source.setAngleFromListener(azimuth, elevation, distance);

// Or set Source's and listener's positions directly.
source.setPosition(x, y, z);
songbird.setListenerPosition(x, y, z);
```

The `Source` orientations can also be set, along with source
directivity and spread control. The listener orientation can be set, which
corresponds to head rotation.

```js
// Set Source and Listener orientation.
source.setOrientation(roll, pitch, yaw);
source.setDirectivityPattern(alpha, exponent);
source.setSourceWidth(sourceWidth);
songbird.setListenerOrientation(roll, pitch, yaw);
```

Alternatively, you can set the listener's orientation using a three.js Matrix4
Camera matrix:

```js
songbird.setListenerOrientationFromCamera(cameraMatrix);
```


### Room Properties

Room properties can be set to control the characteristics of spatial
reflections and reverberation. A list of materials can be found in the
documentation.

```js
// Set room properties.
var dimensions = {
  width : 3.1,
  height : 2.5,
  depth : 3.4
};
var materials = {
  left : 'brick-bare',
  right : 'curtain-heavy',
  front : 'marble',
  back : 'glass-thin',
  down : 'grass',
  up : 'transparent'
};
songbird.setRoomProperties(dimensions, materials);
```


<!-- ## Advanced Usage

Omnitone also provides various building blocks for the first-order-ambisonic decoding and the binaural rendering. The `FOADecoder` is just a ready-made object built with those components. You can create them and connect together build your own decoding mechanism.

### FOARenderer

`FOARenderer` is an optimized FOA stream binaural renderer based on SH-MaxRe HRIR. It uses a specially crafted HRIR for the optimized audio processing, and the URL for HRIR is shown below. `FOARenderer` must be initialized before its usage.

```js
var foaRenderer = Omnitone.createFOARenderer(audioContext, {
  HRIRUrl: 'https://cdn.rawgit.com/GoogleChrome/omnitone/962089ca/build/resources/sh_hrir_o_1.wav',
  channelMap: [0, 1, 2, 3]
});

foaRenderer.initialize().then(/* do stuff when FOARenderer is ready. */);
```

* context (AudioContext): an AudioContext object.
* options (Object): options for decoder.
    - HRIRUrl (String): URL for the SH-MaxRe HRIR.
    - channelMap (Array): A custom channel map.

```js
foaRenderer.input   // A GainNode as an input of FOARenderer.
foaRenderer.output  // A GainNode as an output of FOARenderer.
```

Note that a `FOARenderer` instance has `input` and `output` GainNode. These nodes can be connected to the other AudioNodes for pre/post-processing.

### FOADecoder

`FOADecoder` is a ready-made package of ambisonic gain decoder and binaural renderer.

```js
var foaDecoder = Omnitone.createFOADecoder(context, element, {
  HRTFSetUrl: 'YOUR_HRTF_SET_URL',
  postGainDB: 0,
  channelMap: [0, 1, 2, 3]
});
```

* context (AudioContext): an AudioContext object.
* element (MediaElement): A target video or audio element for streaming.
* options (Object): options for decoder.
    - HRTFSetUrl (String): Base URL for the cube HRTF sets.
    - postGainDB (Number): Post-decoding gain compensation in dB.
    - channelMap (Array): A custom channel map.

### FOARouter

`FOARouter` is useful when you need to change the channel layout of the incoming multichannel audio stream. This is necessary because the channel layout changes depending on the audio codec in the browser.

```js
var router = Omnitone.createFOARouter(context, channelMap);
```

* context (AudioContext): an AudioContext object.
* channelMap (Array): an array represents the target channel layout.

#### Methods

```js
router.setChannelMap([0, 1, 2, 3]); // 4-ch AAC in Chrome (default).
router.setChannelMap([1, 2, 0, 3]); // 4-ch AAC in Safari.
```

### FOARotator

`FOARotator` is a sound field rotator for the first-order-ambisonic decoding. It also performs the coordinate transformation between the world space and the audio space.

```js
var rotator = Omnitone.createFOARotator(context);
```

* context (AudioContext): an AudioContext object.

#### Methods

```js
rotator.setRotationMatrix([1, 0, 0, 0, 1, 0, 0, 0, 1]); // 3x3 row-major matrix.
rotator.setRotationMatrix4([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); // 4x4 row-major matrix.
```

* rotationMatrix (Array): 3x3 row-major matrix.
* rotationMatrix4 (Array): 4x4 row-major matrix.

### FOAPhaseMatchedFilter

`FOAPhaseMatchedFilter` is a pair of pass filters (LP/HP) with a crossover frequency to compensate the gain of high frequency contents without a phase difference.

```js
var filter = Omnitone.createFOAPhaseMatchedFilter(context);
```

* context (AudioContext): an AudioContext object.

### FOAVirtualSpeaker

`FOAVirtualSpeaker` is a virtual speaker abstraction with the decoding gain coefficients and HRTF convolution for the first-order-ambisonic audio stream. Note that the speaker instance directly connects to the destination node of `AudioContext`. So you cannot apply additional audio processing after this component.

```js
var speaker = Omnitone.createFOAVirtualSpeaker(context, options);
```

* context (AudioContext): an AudioContext object.
* options (Object): options for speaker.
    - coefficients: decoding coefficients for (W,X,Y,Z).
    - IR: stereo IR buffer for HRTF convolution.
    - gain: post-gain for the speaker.

#### Methods

```js
speaker.enable();   // activate the speaker.
speaker.disable();  // deactivate the speaker.
```

Deactivating a virtual speaker can save CPU powers. Running multiple HRTF convolution can be computationally expensive, so disabling a speaker might be helpful when the binaural rendering is not necessary.

-->


## Building

Songbird uses [WebPack](https://webpack.github.io/) to build the minified library and to manage dependencies.

```bash
npm install         # install dependencies.
npm run build       # build a non-minified library.
npm run watch       # recompile whenever any source file changes.
npm run build-all   # build a minified library and copy static resources.
npm run doc         # generate documentation.
```


## Test

<!-- TODO(bitllama): Actually setup Travis -->
Songbird uses [Travis](https://travis-ci.org/) and [Karma](https://karma-runner.github.io/1.0/index.html) test runner for continuous integration. (The index HTML page for the local testing is deprecated in v0.2.1.) To run the test suite locally, you have to clone the repository, install dependencies and launch the test runner:

```bash
npm test
```

Note that unit tests require the promisified version of `OfflineAudioContext`, so they might not run on non-spec-compliant browsers. Songbird's Travis CI is using the latest stable version of Chrome.


### Testing Songbird Locally

For the local testing with Karma test runner, Chrome/Chromium-based browser is required. For Linux distros without Chrome browser, the following set up might be necessary for Karma to run properly:

```bash
# Tested with Ubuntu 16.04
sudo apt install chromium-browser
export CHROME_BIN=chromium-browser
```

Windows platform has not been tested for local testing.


## Audio Codec Compatibility

Songbird is designed to run any browser that supports Web Audio API, however, it does not address the incompatibility issue around various media codecs in the browsers. At the time of writing, the decoding of compressed multichannel audio via `<video>` or `<audio>` elements is not fully supported by the majority of mobile browsers.


## Related Resources

* [Omnitone](https://github.com/googlechrome/omnitone)
* [Google Spatial Media](https://github.com/google/spatial-media)
* [Web Audio API](https://webaudio.github.io/web-audio-api/)
* [WebVR](https://webvr.info/)


## Acknowledgments

Special thanks to Alper Gungormusler, Hongchan Choi, Julius Kammerl and Marcin Gorzel for their help on this project.


## Support

If you have found an error in this library, please file an issue at: [https://github.com/Google/songbird/issues](https://github.com/Google/songbird/issues).

Patches are encouraged, and may be submitted by forking this project and submitting a pull request through GitHub. See CONTRIBUTING for more detail.


## License

Copyright 2016 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

