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
- [Porting From PannerNode](#porting-from-pannernode)
- [Building](#building)
- [Testing](#testing)
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

<!-- TODO(bitllama): replace with node_modules/CDN ASAP! -->
```html
<script src="songbird.min.js"></script>
```

<!-- ```html
<!-- Use Songbird from installed node_modules/ -->
<!-- <script src="node_modules/Songbird/build/songbird.min.js"></script> -->

<!-- TODO(bitllama): rawgit/CDN -->
<!-- if you prefer to use CDN -->
<!-- <script src="THISISNOTAREALLINKBUTITWILLBESOON.js"></script> -->

Spatial encoding is done by creating a `Songbird` scene using an associted
`AudioContext` and then creating any number of associated `Source` objects
using `Songbird.createSource()`. The `Songbird` scene models a physical
listener while adding room reflections and reverberation. The `Source`
instances model acoustic sound sources. The library is designed to be easily
integrated into an existing WebAudio audio graph.


### "Hello World" Example

```js
// Create an AudioContext.
var audioContext = new AudioContext();

// Prepare audio element to feed the ambisonic source audio feed.
var audioElement = document.createElement('audio');
audioElement.src = 'resources/SpeechSample.wav';

// Create AudioNode to connect the audio element to WebAudio.
var audioElementSource = audioContext.createMediaElementSource(audioElement);

// Create a (1st-order Ambisonic) Songbird scene.
var songbird = new Songbird(audioContext);

// Send songbird's binaural output to stereo-out.
songbird.output.connect(audioContext.destination);

// Create a Source, connect desired audio input to it.
var source = songbird.createSource();
audioElementSource.connect(source.input);

// Pan the source 45 degrees to the left (counter-clockwise).
source.setAngleFromListener(45);

// Wait 1 second and then playback the audio.
setTimeout(audioElement.play(), 1000);
```


### Source/Listener Placement

Usage begins by creating a `Songbird` scene, which manages all sources,
the listener and the reverberation model.

```js
var songbird = new Songbird(audioContext);
```

Once the main `Songbird` scene is created, it can be used to be create
as many sources as desired. The `Songbird` scene will manage the output for any and all sources created.

```js
var source = songbird.createSource();

// Create other sources.
var sourceB = songbird.createSource();
var sourceC = songbird.createSource();
// etc. ...
```

These `Source` instances are automatically managed and modelled by the
`Songbird` scene. Simply provide the desired monophonic input to each source
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

Alternatively, the listener's orientation can be set using a three.js Matrix4
Camera matrix:

```js
songbird.setListenerOrientationFromCamera(cameraMatrix);
```


### Room Properties

Room properties can be set to control the characteristics of spatial
reflections and reverberation. A comprehensive list of materials can be found
in the documentation.

```js
// Set room acoustics properties.
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


## Porting From PannerNode

For projects already employing [PannerNode](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode), it is fairly simple to switch to Songbird. Below is a basic `PannerNode` example:

```js
// Create a "PannerNode."
var panner = audioContext.createPanner();

// Initialize properties
panner.panningModel = 'HRTF';
panner.distanceModel = 'inverse';
panner.refDistance = 0.1;
panner.maxDistance = 1000;

// Connect input to "PannerNode".
audioElementSource.connect(panner);

// Connect "PannerNode" to audio output.
panner.connect(audioContext.destination);

// Set "PannerNode" and Listener positions.
panner.setPosition(x, y, z);
audioContext.listener.setPosition(x, y, z);
```

And below is the same example converted to Songbird:

```js
// Create a Songbird "Source" with properties.
var source = songbird.createSource({
 rolloff: 'logarithmic',
 minDistance: 0.1,
 maxDistance: 1000
});

// Connect input to "Source."
audioElementSource.connect(source.input);

// Set "Source" and Listener positions.
source.setPosition(x, y, z);
songbird.setListenerPosition(x, y, z);
```


## Building

Songbird uses [WebPack](https://webpack.github.io/) to build the minified
library and to manage dependencies.

```bash
npm install         # install dependencies.
npm run build       # build a non-minified library.
npm run watch       # recompile whenever any source file changes.
npm run build-all   # build a minified library and copy static resources.
npm run doc         # generate documentation.
```


## Testing

<!-- TODO(bitllama): Actually setup Travis -->
<!-- Songbird uses [Travis](https://travis-ci.org/) and [Karma]
(https://karma-runner.github.io/1.0/index.html) test runner for continuous
integration (The index HTML page for the local testing is deprecated in
v0.2.1). -->
To run the test suite locally, clone the repository, install dependencies and launch the test runner:

```bash
npm test
```

Note that unit tests require the promisified version of `OfflineAudioContext`,
so they might not run on non-spec-compliant browsers. Songbird's Travis CI is
using the latest stable version of Chrome.


### Testing Songbird Locally

For the local testing with Karma test runner, Chrome/Chromium-based browser is
required. For Linux distros without Chrome browser, the following set up might
be necessary for Karma to run properly:

```bash
# Tested with Ubuntu 16.04
sudo apt install chromium-browser
export CHROME_BIN=chromium-browser
```

Windows platform has not been tested for local testing.


## Audio Codec Compatibility

Songbird is designed to run any browser that supports Web Audio API, however,
it does not address the incompatibility issue around various media codecs in
the browsers. At the time of writing, the decoding of compressed multichannel
audio via `<video>` or `<audio>` elements is not fully supported by the majority
of mobile browsers.


## Related Resources

* [Omnitone](https://github.com/googlechrome/omnitone)
* [Google Spatial Media](https://github.com/google/spatial-media)
* [Web Audio API](https://webaudio.github.io/web-audio-api/)
* [WebVR](https://webvr.info/)


## Acknowledgments

Special thanks to Alper Gungormusler, Hongchan Choi, Marcin Gorzel, and Julius Kammerl for their help on this project.


## Support

If you have found an error in this library, please file an issue at: [https://github.com/Google/songbird/issues](https://github.com/Google/songbird/issues).

Patches are encouraged, and may be submitted by forking this project and submitting a pull request through GitHub. See CONTRIBUTING for more detail.


## License

Copyright &copy; 2017 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

[http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

