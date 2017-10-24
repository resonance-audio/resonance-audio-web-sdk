let audioContext = new AudioContext();

// Create a (1st-order Ambisonic) Songbird scene.
let songbird = new Songbird(audioContext);

// Send songbird's binaural output to stereo out.
songbird.output.connect(audioContext.destination);

// Set room acoustics properties.
let dimensions = {
  width: 3.1,
  height: 2.5,
  depth: 3.4,
};
let materials = {
  left: 'brick-bare',
  right: 'curtain-heavy',
  front: 'marble',
  back: 'glass-thin',
  down: 'grass',
  up: 'transparent',
};
songbird.setRoomProperties(dimensions, materials);

// Create an audio element. Feed into audio graph.
let audioElement = document.createElement('audio');
audioElement.src = 'resources/CubeSound.wav';

let audioElementSource =
  audioContext.createMediaElementSource(audioElement);

// Create a Source, connect desired audio input to it.
let source = songbird.createSource();
audioElementSource.connect(source.input);

// The source position is relative to the origin
// (center of the room).
source.setPosition(-0.707, -0.707, 0);

// Playback the audio.
audioElement.play();
