# Songbird: Spatial Audio Encoding on the Web

[![Travis](https://travis-ci.org/google/songbird.svg?branch=master)](https://travis-ci.org/google/songbird) [![npm](https://img.shields.io/npm/v/songbird-audio.svg?colorB=4bc51d)](https://www.npmjs.com/package/songbird-audio) [![GitHub license](https://img.shields.io/badge/license-Apache%202-brightgreen.svg)](https://raw.githubusercontent.com/google/songbird/master/LICENSE)

Songbird is a real-time spatial audio encoding JavaScript library for WebAudio
applications. It allows web developers to dynamically spatially-encode
streaming audio content into scalable
[ambisonics](https://en.wikipedia.org/wiki/Ambisonics) signal, which can be
rendered using a binaural renderer such as
[Omnitone](https://github.com/GoogleChrome/omnitone) for realistic and
quality-scalable 3D audio.


Hear Songbird in action:
- [PannerNode vs. Songbird example](https://rawgit.com/google/songbird/master/examples/panner-node-vs-songbird.html)
- [Room model example](https://rawgit.com/google/songbird/master/examples/room-model.html)
- [Flock of Birds](https://rawgit.com/google/songbird/master/examples/birds.html)


The implementation of Songbird is based on the
[Google spatial media](https://github.com/google/spatial-media) specification.
It expects mono input to its `Source` instances and outputs
ambisonic (multichannel) ACN channel layout with SN3D normalization.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [How it works](#how-it-works)
- [Installation](#installation)
- [Usage](#usage)
  - ["Hello World" Example](#hello-world-example)
  - [Positioning Sources and the Listener](#positioning-sources-and-the-listener)
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
  <img
    src="https://cdn.rawgit.com/google/songbird/master/diagram-songbird.png"
    alt="Songbird Diagram">
</p>


## Installation

Songbird is designed to be used for web front-end projects. So [NPM](https://www.npmjs.com/) is recommended if you want to install the library to your web project. You can also clone this repository and use the library file as usual.

```bash
npm install songbird-audio
```


## Usage

The first step is to include the library file in an HTML document.

```html
<!-- Use Songbird from installed node_modules/ -->
<script src="node_modules/songbird-audio/build/songbird.min.js"></script>

<!-- if you prefer to use CDN -->
<script src="https://cdn.rawgit.com/google/songbird/master/build/songbird.min.js"></script>
```

Spatial encoding is done by creating a `Songbird` scene using an associted
`AudioContext` and then creating any number of associated `Source` objects
using `Songbird.createSource()`. The `Songbird` scene models a physical
listener while adding room reflections and reverberation. The `Source`
instances model acoustic sound sources. The library is designed to be easily
integrated into an existing WebAudio audio graph.


### "Hello World" Example

Let's see how we can create a scene and generate some audio. Let's begin by
constructing an `AudioContext` and `Songbird` scene and connecting it to the
audio output. You can view a live demo of this example [here](https://rawgit.com/google/songbird/master/examples/hello-world.html).

```js
var audioContext = new AudioContext();

// Create a (1st-order Ambisonic) Songbird scene.
var songbird = new Songbird(audioContext);

// Send songbird's binaural output to stereo out.
songbird.output.connect(audioContext.destination);
```

Next, let's add a room. By default, the room size is 0m x 0m x 0m (i.e. there
is no room and we are in free space). To define a room, we simply need to
provide the dimensions in meters (the room's center is the origin). We can also
define the materials of each of the 6 surfaces (4 walls + ceiling + floor). A
range of materials are predefined in Songbird, each with different reflection
properties.

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

Next, we create an audio element, load some audio and feed the audio element
into the audio graph. We then create a `Source` and connect the elements
together. The default position for a `Source` is the origin.

```js
// Create an audio element. Feed into audio graph.
var audioElement = document.createElement('audio');
audioElement.src = 'resources/SpeechSample.wav';

var audioElementSource = audioContext.createMediaElementSource(audioElement);

// Create a Source, connect desired audio input to it.
var source = songbird.createSource();
audioElementSource.connect(source.input);
```

Finally, we can position the source relative to the listener and then playback
the audio with the familiar `.play()` method. This will binaurally render the
scene we have just created.

```js
// The source position is relative to the origin (center of the room).
source.setPosition(-0.707, -0.707, 0);

// Playback the audio.
audioElement.play();
```


### Positioning Sources and the Listener

`Source` objects can be placed with cartesian coordinates relative to the origin (center of the room). Songbird uses a right-handed coordinate system, similar to OpenGL and Three.js.

```js
// Or Source's and Listener's positions.
source.setPosition(x, y, z);
songbird.setListenerPosition(x, y, z);
```

The `Source` and Listener orientations can be set using forward and up vectors:

```js
// Set Source and Listener orientation.
source.setOrientation(forward_x, forward_y, forward_z, up_x, up_y, up_z);
songbird.setListenerOrientation(forward_x, forward_y, forward_z, up_x, up_y, up_z);
```

Alternatively, the `Source`'s and Listener position and orientation can be set using Three.js Matrix4 objects:

```js
source.setFromMatrix(matrix4);
songbird.setListenerFromMatrix(matrix4);
```


<!-- ### Source width and directivity

... -->


### Room Properties

Room properties can be set to control the characteristics of spatial
reflections and reverberation. We currently support the following named
materials:
- transparent
- acoustic-ceiling-tiles
- brick-bare
- brick-painted
- concrete-block-coarse
- concrete-block-painted
- curtain-heavy
- fiber-glass-insulation
- glass-thin
- glass-thick
- grass
- linoleum-on-concrete
- marble
- metal
- parquet-on-concrete
- plaster-smooth
- plywood-panel
- polished-concrete-or-tile
- sheetrock
- water-or-ice-surface
- wood-ceiling
- wood-panel
- uniform


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

// Connect Songbird’s output to audio output.
songbird.output.connect(audioContext.destination);

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

Songbird uses [Travis](https://travis-ci.org/) and [Karma](https://karma-runner.github.io/1.0/index.html) test runner for continuous
integration. To run the test suite locally, clone the repository, install dependencies and launch the test runner:

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

